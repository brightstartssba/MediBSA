import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { LogoutButton } from "@/components/logout-button";
import type { User, Video } from "@shared/schema";

export default function Profile() {
  const { userId } = useParams<{ userId?: string }>();
  const { user: currentUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const targetUserId = userId || currentUser?.uid;
  const isOwnProfile = !userId || userId === currentUser?.uid;

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Redirecting to login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/users", targetUserId],
    enabled: !!targetUserId,
    retry: false,
  });

  const { data: userVideos = [], isLoading: videosLoading } = useQuery<Video[]>({
    queryKey: ["/api/users", targetUserId, "videos"],
    enabled: !!targetUserId,
    retry: false,
  });

  if (authLoading || userLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">User not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-y-auto">
      {/* Profile Header */}
      <div className="relative">
        {/* Cover Image */}
        <div className="w-full h-48 bg-gradient-to-br from-app-pink/30 to-app-cyan/30"></div>
        
        {/* Header Actions */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            className="text-white hover:bg-white/20"
          >
            <i className="fas fa-arrow-left text-xl"></i>
          </Button>
          {isOwnProfile && <LogoutButton />}
        </div>
        
        {/* Profile Info */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-end space-x-4">
            <img
              src={user.profileImageUrl || "https://via.placeholder.com/80"}
              alt="Profile"
              className="w-20 h-20 rounded-full border-4 border-white object-cover"
            />
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">
                {user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user.username}
              </h1>
              <p className="text-app-gray">@{user.username}</p>
            </div>
            
            {!isOwnProfile && (
              <Button className="bg-app-pink text-white px-6 py-2 rounded-lg font-semibold hover:bg-app-pink/80">
                Follow
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Profile Stats */}
      <div className="px-4 pt-6">
        <div className="flex items-center space-x-8 mb-6">
          <div className="text-center">
            <p className="text-xl font-bold text-white">{user.followingCount || 0}</p>
            <p className="text-sm text-app-gray">Following</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-white">{user.followersCount || 0}</p>
            <p className="text-sm text-app-gray">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-white">{user.likesCount || 0}</p>
            <p className="text-sm text-app-gray">Likes</p>
          </div>
        </div>
        
        {/* Bio */}
        {user.bio && (
          <p className="text-white mb-6">{user.bio}</p>
        )}
        
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-800 mb-4">
          <button className="flex-1 py-3 text-center border-b-2 border-white text-white font-medium">
            <i className="fas fa-th-large mr-2"></i>Videos
          </button>
          <button className="flex-1 py-3 text-center text-app-gray">
            <i className="fas fa-heart mr-2"></i>Liked
          </button>
        </div>
        
        {/* Video Grid */}
        {videosLoading ? (
          <div className="text-center py-8">
            <div className="text-app-gray">Loading videos...</div>
          </div>
        ) : userVideos.length === 0 ? (
          <div className="text-center py-12">
            <i className="fas fa-video text-4xl text-app-gray mb-4"></i>
            <p className="text-app-gray">No videos yet</p>
            {isOwnProfile && (
              <p className="text-sm text-app-gray mt-2">Start creating to share your story!</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 mb-4">
            {userVideos.map((video: any) => (
              <div key={video.id} className="aspect-[9/16] relative">
                <img
                  src={video.thumbnailUrl || "https://via.placeholder.com/200x300"}
                  alt="Video thumbnail"
                  className="w-full h-full object-cover rounded-lg"
                />
                <div className="absolute bottom-2 left-2 flex items-center space-x-1">
                  <i className="fas fa-play text-white text-xs"></i>
                  <span className="text-white text-xs">
                    {video.viewsCount > 1000 
                      ? `${(video.viewsCount / 1000).toFixed(1)}K`
                      : video.viewsCount || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="pb-20"></div>
      </div>
    </div>
  );
}
