import {
  users,
  videos,
  comments,
  likes,
  follows,
  type User,
  type InsertUser,
  type Video,
  type InsertVideo,
  type Comment,
  type Like,
  type Follow,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: InsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  updateUserStats(userId: string, stats: Partial<Pick<User, 'followersCount' | 'followingCount' | 'likesCount'>>): Promise<void>;
  
  // Video operations
  createVideo(video: InsertVideo): Promise<Video>;
  getVideo(id: string): Promise<Video | undefined>;
  getVideosByUser(userId: string): Promise<Video[]>;
  getFeedVideos(limit?: number, offset?: number): Promise<Video[]>;
  updateVideoStats(videoId: string, stats: Partial<Pick<Video, 'likesCount' | 'commentsCount' | 'viewsCount'>>): Promise<void>;
  
  // Comment operations
  createComment(comment: Omit<Comment, 'id' | 'createdAt' | 'likesCount'>): Promise<Comment>;
  getCommentsByVideo(videoId: string): Promise<Comment[]>;
  
  // Like operations
  createLike(like: Omit<Like, 'id' | 'createdAt'>): Promise<Like>;
  deleteLike(userId: string, videoId?: string, commentId?: string): Promise<void>;
  getUserLike(userId: string, videoId?: string, commentId?: string): Promise<Like | undefined>;
  
  // Follow operations
  createFollow(followerId: string, followingId: string): Promise<Follow>;
  deleteFollow(followerId: string, followingId: string): Promise<void>;
  getFollow(followerId: string, followingId: string): Promise<Follow | undefined>;
  getFollowers(userId: string): Promise<User[]>;
  getFollowing(userId: string): Promise<User[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        username: userData.username || `user_${userData.id.slice(0, 8)}`,
      })
      .returning();
    return user;
  }

  async upsertUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        username: userData.username || `user_${userData.id.slice(0, 8)}`,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async updateUserStats(userId: string, stats: Partial<Pick<User, 'followersCount' | 'followingCount' | 'likesCount'>>): Promise<void> {
    await db
      .update(users)
      .set({ ...stats, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  // Video operations
  async createVideo(videoData: InsertVideo): Promise<Video> {
    const id = randomUUID();
    const [video] = await db
      .insert(videos)
      .values({ ...videoData, id })
      .returning();
    return video;
  }

  async getVideo(id: string): Promise<Video | undefined> {
    const [video] = await db.select().from(videos).where(eq(videos.id, id));
    return video;
  }

  async getVideosByUser(userId: string): Promise<Video[]> {
    return await db
      .select()
      .from(videos)
      .where(eq(videos.userId, userId))
      .orderBy(desc(videos.createdAt));
  }

  async getFeedVideos(limit = 10, offset = 0): Promise<Video[]> {
    return await db
      .select()
      .from(videos)
      .where(eq(videos.isPublic, true))
      .orderBy(desc(videos.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async updateVideoStats(videoId: string, stats: Partial<Pick<Video, 'likesCount' | 'commentsCount' | 'viewsCount'>>): Promise<void> {
    await db
      .update(videos)
      .set({ ...stats, updatedAt: new Date() })
      .where(eq(videos.id, videoId));
  }

  // Comment operations
  async createComment(commentData: Omit<Comment, 'id' | 'createdAt' | 'likesCount'>): Promise<Comment> {
    const id = randomUUID();
    const [comment] = await db
      .insert(comments)
      .values({ ...commentData, id })
      .returning();
    
    // Update video comment count
    const video = await this.getVideo(commentData.videoId);
    if (video) {
      await this.updateVideoStats(commentData.videoId, { 
        commentsCount: (video.commentsCount || 0) + 1 
      });
    }
    
    return comment;
  }

  async getCommentsByVideo(videoId: string): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.videoId, videoId))
      .orderBy(desc(comments.createdAt));
  }

  // Like operations
  async createLike(likeData: Omit<Like, 'id' | 'createdAt'>): Promise<Like> {
    const id = randomUUID();
    const [like] = await db
      .insert(likes)
      .values({ ...likeData, id })
      .returning();
    
    // Update stats
    if (likeData.videoId) {
      const video = await this.getVideo(likeData.videoId);
      if (video) {
        await this.updateVideoStats(likeData.videoId, { 
          likesCount: (video.likesCount || 0) + 1 
        });
      }
    }
    if (likeData.commentId) {
      await db
        .update(comments)
        .set({ likesCount: sql`${comments.likesCount} + 1` })
        .where(eq(comments.id, likeData.commentId));
    }
    
    return like;
  }

  async deleteLike(userId: string, videoId?: string, commentId?: string): Promise<void> {
    const conditions: any[] = [eq(likes.userId, userId)];
    if (videoId) conditions.push(eq(likes.videoId, videoId));
    if (commentId) conditions.push(eq(likes.commentId, commentId));
    
    const [like] = await db
      .select()
      .from(likes)
      .where(and(...conditions));
    
    if (like) {
      await db.delete(likes).where(eq(likes.id, like.id));
      
      // Update stats
      if (videoId) {
        await db
          .update(videos)
          .set({ likesCount: sql`GREATEST(0, ${videos.likesCount} - 1)` })
          .where(eq(videos.id, videoId));
      }
      if (commentId) {
        await db
          .update(comments)
          .set({ likesCount: sql`GREATEST(0, ${comments.likesCount} - 1)` })
          .where(eq(comments.id, commentId));
      }
    }
  }

  async getUserLike(userId: string, videoId?: string, commentId?: string): Promise<Like | undefined> {
    const conditions: any[] = [eq(likes.userId, userId)];
    if (videoId) conditions.push(eq(likes.videoId, videoId));
    if (commentId) conditions.push(eq(likes.commentId, commentId));
    
    const [like] = await db
      .select()
      .from(likes)
      .where(and(...conditions));
    
    return like;
  }

  // Follow operations
  async createFollow(followerId: string, followingId: string): Promise<Follow> {
    const id = randomUUID();
    const [follow] = await db
      .insert(follows)
      .values({ id, followerId, followingId })
      .returning();
    
    // Update user stats
    await db
      .update(users)
      .set({ followingCount: sql`${users.followingCount} + 1` })
      .where(eq(users.id, followerId));
    
    await db
      .update(users)
      .set({ followersCount: sql`${users.followersCount} + 1` })
      .where(eq(users.id, followingId));
    
    return follow;
  }

  async deleteFollow(followerId: string, followingId: string): Promise<void> {
    const [follow] = await db
      .select()
      .from(follows)
      .where(and(
        eq(follows.followerId, followerId),
        eq(follows.followingId, followingId)
      ));
    
    if (follow) {
      await db.delete(follows).where(eq(follows.id, follow.id));
      
      // Update user stats
      await db
        .update(users)
        .set({ followingCount: sql`GREATEST(0, ${users.followingCount} - 1)` })
        .where(eq(users.id, followerId));
      
      await db
        .update(users)
        .set({ followersCount: sql`GREATEST(0, ${users.followersCount} - 1)` })
        .where(eq(users.id, followingId));
    }
  }

  async getFollow(followerId: string, followingId: string): Promise<Follow | undefined> {
    const [follow] = await db
      .select()
      .from(follows)
      .where(and(
        eq(follows.followerId, followerId),
        eq(follows.followingId, followingId)
      ));
    
    return follow;
  }

  async getFollowers(userId: string): Promise<User[]> {
    const result = await db
      .select()
      .from(users)
      .innerJoin(follows, eq(follows.followerId, users.id))
      .where(eq(follows.followingId, userId));
    
    return result.map(row => row.users);
  }

  async getFollowing(userId: string): Promise<User[]> {
    const result = await db
      .select()
      .from(users)
      .innerJoin(follows, eq(follows.followingId, users.id))
      .where(eq(follows.followerId, userId));
    
    return result.map(row => row.users);
  }
}

export const storage = new DatabaseStorage();
