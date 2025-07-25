import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import InteractionPanel from "./interaction-panel";
import CommentsModal from "./comments-modal";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface VideoPlayerProps {
  video: any;
  isActive: boolean;
}

export default function VideoPlayer({ video, isActive }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Handle video play/pause based on isActive prop
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.muted = true; // Start muted for autoplay
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(console.error);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(console.error);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const likeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/videos/${video.id}/like`);
    },
    onSuccess: () => {
      setIsLiked(!isLiked);
      queryClient.invalidateQueries({ queryKey: ["/api/videos/feed"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to like video",
        variant: "destructive",
      });
    },
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/users/${video.user.id}/follow`);
    },
    onSuccess: () => {
      setIsFollowing(!isFollowing);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to follow user",
        variant: "destructive",
      });
    },
  });

  const handleLike = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to like videos",
        variant: "destructive",
      });
      return;
    }
    likeMutation.mutate();
  };

  const handleFollow = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to follow users",
        variant: "destructive",
      });
      return;
    }
    if (video.user.id === user?.uid) {
      toast({
        title: "Cannot Follow",
        description: "You cannot follow yourself",
        variant: "destructive",
      });
      return;
    }
    followMutation.mutate();
  };

  const formatCount = (count: number) => {
    if (count > 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count > 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getRelativeTime = (date: string) => {
    const now = new Date();
    const videoDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - videoDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  return (
    <div className="h-screen relative bg-black flex items-center justify-center snap-start">
      {/* Video Background */}
      <div className="absolute inset-0">
        {video.videoUrl ? (
          <video
            ref={videoRef}
            className="w-full h-full object-cover cursor-pointer"
            src={video.videoUrl}
            loop
            playsInline
            muted
            onClick={togglePlayPause}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onVolumeChange={() => setIsMuted(videoRef.current?.muted || false)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-app-pink/20 to-app-cyan/20 flex items-center justify-center">
            <i className="fas fa-video text-6xl text-app-gray"></i>
          </div>
        )}
      </div>
      
      {/* Video Overlay UI */}
      <div className="absolute inset-0 flex">
        {/* Left Side - Video Info */}
        <div className="flex-1 flex flex-col justify-end p-4 pb-24">
          {/* User Info */}
          <div className="flex items-center space-x-3 mb-3">
            <img
              src={video.user?.profileImageUrl || "https://via.placeholder.com/48"}
              alt="User avatar"
              className="w-12 h-12 rounded-full border-2 border-white object-cover"
            />
            <div>
              <h3 className="font-semibold text-white">@{video.user?.username || 'unknown'}</h3>
              <p className="text-sm text-app-gray">
                {video.createdAt ? getRelativeTime(video.createdAt) : 'recently'}
              </p>
            </div>
            {video.user?.id !== user?.uid && (
              <button
                onClick={handleFollow}
                disabled={followMutation.isPending}
                className={`px-4 py-1 rounded-full text-sm font-semibold transition-colors ${
                  isFollowing
                    ? 'bg-gray-600 text-white'
                    : 'bg-app-pink text-white hover:bg-pink-600'
                }`}
              >
                {followMutation.isPending ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
          
          {/* Video Description */}
          {video.description && (
            <p className="text-white mb-2 text-sm leading-relaxed">
              {video.description}
            </p>
          )}
          
          {/* Music Info */}
          <div className="flex items-center space-x-2">
            <i className="fas fa-music text-white text-sm"></i>
            <p className="text-sm text-white truncate">
              Original sound - {video.user?.username || 'unknown'}
            </p>
          </div>
        </div>
        
        {/* Right Side - Interaction Panel */}
        <InteractionPanel
          video={video}
          isLiked={isLiked}
          onLike={handleLike}
          onComment={() => setShowComments(true)}
          onShare={() => {
            toast({
              title: "Shared!",
              description: "Video link copied to clipboard",
            });
          }}
          likesCount={video.likesCount || 0}
          commentsCount={video.commentsCount || 0}
          formatCount={formatCount}
        />
      </div>
      
      {/* Video Controls */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center space-x-2">
          <button
            onClick={togglePlayPause}
            className="text-white hover:text-app-gray bg-black bg-opacity-50 rounded-full p-2"
          >
            <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} text-lg`}></i>
          </button>
          <div className="w-32 h-1 bg-white bg-opacity-30 rounded-full">
            <div className="w-1/3 h-full bg-white rounded-full"></div>
          </div>
        </div>
        <button
          onClick={toggleMute}
          className="text-white hover:text-app-gray bg-black bg-opacity-50 rounded-full p-2"
        >
          <i className={`fas ${isMuted ? 'fa-volume-mute' : 'fa-volume-up'} text-lg`}></i>
        </button>
      </div>
      
      {/* Comments Modal */}
      {showComments && (
        <CommentsModal
          videoId={video.id}
          onClose={() => setShowComments(false)}
        />
      )}
    </div>
  );
}
