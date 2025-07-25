import { useQuery } from "@tanstack/react-query";
import VideoPlayer from "./video-player";
import type { Video } from "@shared/schema";

interface VideoFeedProps {
  tab: 'following' | 'forYou';
}

export default function VideoFeed({ tab }: VideoFeedProps) {
  const { data: videos = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/videos/feed"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="text-white">Loading videos...</div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <i className="fas fa-video text-4xl text-app-gray mb-4"></i>
          <p className="text-white text-lg mb-2">No videos available</p>
          <p className="text-app-gray">Be the first to create and share!</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-screen overflow-y-scroll snap-y snap-mandatory"
      style={{ scrollSnapType: 'y mandatory' }}
    >
      {videos.map((video: any, index: number) => (
        <VideoPlayer 
          key={video.id} 
          video={video} 
          isActive={index === 0}
        />
      ))}
    </div>
  );
}
