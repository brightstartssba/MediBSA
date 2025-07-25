import { useState } from "react";
import VideoFeed from "@/components/video-feed";
import BottomNavigation from "@/components/bottom-navigation";
import TopHeader from "@/components/top-header";
import CreateVideoModal from "@/components/create-video-modal";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<'following' | 'forYou'>('forYou');
  const { user } = useAuth();

  return (
    <div className="relative h-screen bg-black overflow-hidden">
      <TopHeader currentTab={currentTab} onTabChange={setCurrentTab} />
      
      <VideoFeed tab={currentTab} />
      
      <BottomNavigation 
        onCreateClick={() => setIsCreateModalOpen(true)}
        currentUserId={user?.uid}
      />
      
      {isCreateModalOpen && (
        <CreateVideoModal onClose={() => setIsCreateModalOpen(false)} />
      )}
    </div>
  );
}
