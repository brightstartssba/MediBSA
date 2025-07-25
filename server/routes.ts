import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { requireFirebaseAuth } from "./firebaseMiddleware";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

// Firebase configuration endpoint
function setupFirebaseConfig(app: Express) {
  app.get('/api/config/firebase', (req, res) => {
    const config = {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
    };
    
    // Check if Firebase is properly configured
    const isConfigured = config.apiKey && config.authDomain && config.projectId;
    
    res.json({
      ...config,
      isConfigured
    });
  });
}
import { insertVideoSchema, insertCommentSchema } from "@shared/schema";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'), false);
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Verify all environment variables are loaded from .env file
  console.log('Environment variables loaded from .env:');
  console.log('- DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 20) + '...');
  console.log('- FIREBASE_API_KEY:', process.env.FIREBASE_API_KEY ? 'loaded' : 'missing');
  console.log('- CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME || 'missing');
  console.log('- SESSION_SECRET:', process.env.SESSION_SECRET ? 'loaded' : 'missing');

  // Configure Cloudinary after dotenv is loaded
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  // Setup Firebase config endpoint
  setupFirebaseConfig(app);
  
  // Auth middleware
  await setupAuth(app);

  // Firebase auth verification route
  app.post('/api/auth/verify', async (req, res) => {
    try {
      const { uid, email, displayName } = req.body;
      
      if (!uid || !email) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Create or update user in database
      const user = await storage.upsertUser({
        id: uid,
        email: email,
        username: displayName || email?.split('@')[0] || 'User',
        firstName: displayName || email?.split('@')[0] || 'User',
        lastName: null,
        profileImageUrl: null,
      });
      
      res.json(user);
    } catch (error) {
      console.error("Error verifying Firebase user:", error);
      res.status(500).json({ message: "Failed to verify user" });
    }
  });

  // Firebase-based user endpoint
  app.get('/api/auth/firebase-user', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const uid = req.headers['x-user-id'] as string;
      if (!uid) {
        return res.status(401).json({ message: 'User ID required' });
      }

      const user = await storage.getUser(uid);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching Firebase user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Video routes
  app.get('/api/videos/feed', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const videos = await storage.getFeedVideos(limit, offset);
      
      // Enrich with user data
      const enrichedVideos = await Promise.all(
        videos.map(async (video) => {
          const user = await storage.getUser(video.userId);
          return {
            ...video,
            user: user ? {
              id: user.id,
              username: user.username,
              profileImageUrl: user.profileImageUrl,
              firstName: user.firstName,
              lastName: user.lastName,
            } : null,
          };
        })
      );
      
      res.json(enrichedVideos);
    } catch (error) {
      console.error("Error fetching video feed:", error);
      res.status(500).json({ message: "Failed to fetch videos" });
    }
  });

  // Video upload endpoint
  app.post('/api/videos/upload', requireFirebaseAuth, upload.single('video'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No video file provided" });
      }

      const userId = req.userId;
      const { title, description, isPublic = true } = req.body;

      // Upload to Cloudinary
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "video",
          folder: "tiktok-videos",
          public_id: `video_${Date.now()}`,
        },
        async (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            return res.status(500).json({ message: "Failed to upload video" });
          }

          try {
            // Create video record in database
            const videoData = insertVideoSchema.parse({
              userId,
              title: title || "Untitled Video",
              description: description || "",
              videoUrl: result!.secure_url,
              thumbnailUrl: result!.secure_url.replace(/\.[^.]+$/, '.jpg'), // Generate thumbnail URL
              duration: Math.round(result!.duration || 0),
              isPublic: isPublic === 'true' || isPublic === true,
            });

            const video = await storage.createVideo(videoData);
            res.json(video);
          } catch (dbError) {
            console.error("Database error:", dbError);
            res.status(500).json({ message: "Failed to save video to database" });
          }
        }
      );

      uploadStream.end(req.file.buffer);
    } catch (error) {
      console.error("Error uploading video:", error);
      res.status(500).json({ message: "Failed to upload video" });
    }
  });

  app.post('/api/videos', requireFirebaseAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const videoData = insertVideoSchema.parse({ ...req.body, userId });
      
      const video = await storage.createVideo(videoData);
      res.json(video);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid video data", errors: error.errors });
      } else {
        console.error("Error creating video:", error);
        res.status(500).json({ message: "Failed to create video" });
      }
    }
  });

  app.get('/api/videos/:videoId', async (req, res) => {
    try {
      const video = await storage.getVideo(req.params.videoId);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      const user = await storage.getUser(video.userId);
      res.json({
        ...video,
        user: user ? {
          id: user.id,
          username: user.username,
          profileImageUrl: user.profileImageUrl,
          firstName: user.firstName,
          lastName: user.lastName,
        } : null,
      });
    } catch (error) {
      console.error("Error fetching video:", error);
      res.status(500).json({ message: "Failed to fetch video" });
    }
  });

  app.get('/api/users/:userId/videos', async (req, res) => {
    try {
      const videos = await storage.getVideosByUser(req.params.userId);
      res.json(videos);
    } catch (error) {
      console.error("Error fetching user videos:", error);
      res.status(500).json({ message: "Failed to fetch user videos" });
    }
  });

  // Comment routes
  app.get('/api/videos/:videoId/comments', async (req, res) => {
    try {
      const comments = await storage.getCommentsByVideo(req.params.videoId);
      
      // Enrich with user data
      const enrichedComments = await Promise.all(
        comments.map(async (comment) => {
          const user = await storage.getUser(comment.userId);
          return {
            ...comment,
            user: user ? {
              id: user.id,
              username: user.username,
              profileImageUrl: user.profileImageUrl,
            } : null,
          };
        })
      );
      
      res.json(enrichedComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post('/api/videos/:videoId/comments', requireFirebaseAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const commentData = insertCommentSchema.parse({
        ...req.body,
        userId,
        videoId: req.params.videoId,
      });
      
      const comment = await storage.createComment(commentData);
      const user = await storage.getUser(comment.userId);
      
      res.json({
        ...comment,
        user: user ? {
          id: user.id,
          username: user.username,
          profileImageUrl: user.profileImageUrl,
        } : null,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      } else {
        console.error("Error creating comment:", error);
        res.status(500).json({ message: "Failed to create comment" });
      }
    }
  });

  // Like routes
  app.post('/api/videos/:videoId/like', requireFirebaseAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const videoId = req.params.videoId;
      
      // Check if already liked
      const existingLike = await storage.getUserLike(userId, videoId);
      if (existingLike) {
        await storage.deleteLike(userId, videoId);
        res.json({ liked: false });
      } else {
        await storage.createLike({ userId, videoId, commentId: null });
        res.json({ liked: true });
      }
    } catch (error) {
      console.error("Error toggling video like:", error);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  app.post('/api/comments/:commentId/like', requireFirebaseAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const commentId = req.params.commentId;
      
      // Check if already liked
      const existingLike = await storage.getUserLike(userId, undefined, commentId);
      if (existingLike) {
        await storage.deleteLike(userId, undefined, commentId);
        res.json({ liked: false });
      } else {
        await storage.createLike({ userId, videoId: null, commentId });
        res.json({ liked: true });
      }
    } catch (error) {
      console.error("Error toggling comment like:", error);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  // Follow routes
  app.post('/api/users/:userId/follow', requireFirebaseAuth, async (req: any, res) => {
    try {
      const followerId = req.userId;
      const followingId = req.params.userId;
      
      if (followerId === followingId) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }
      
      // Check if already following
      const existingFollow = await storage.getFollow(followerId, followingId);
      if (existingFollow) {
        await storage.deleteFollow(followerId, followingId);
        res.json({ following: false });
      } else {
        await storage.createFollow(followerId, followingId);
        res.json({ following: true });  
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      res.status(500).json({ message: "Failed to toggle follow" });
    }
  });

  app.get('/api/users/:userId', async (req, res) => {
    try {
      const user = await storage.getUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
