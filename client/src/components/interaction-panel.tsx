interface InteractionPanelProps {
  video: any;
  isLiked: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  likesCount: number;
  commentsCount: number;
  formatCount: (count: number) => string;
}

export default function InteractionPanel({
  video,
  isLiked,
  onLike,
  onComment,
  onShare,
  likesCount,
  commentsCount,
  formatCount,
}: InteractionPanelProps) {
  return (
    <div className="flex flex-col items-center justify-end space-y-6 p-4 pb-24">
      {/* Profile Avatar */}
      <div className="relative">
        <img
          src={video.user?.profileImageUrl || "https://via.placeholder.com/48"}
          alt="Creator profile"
          className="w-12 h-12 rounded-full border-2 border-white object-cover"
        />
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-app-pink rounded-full flex items-center justify-center">
          <i className="fas fa-plus text-white text-xs"></i>
        </div>
      </div>
      
      {/* Like Button */}
      <div className="flex flex-col items-center">
        <button
          onClick={onLike}
          className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20 transition-all"
        >
          <i className={`fas fa-heart text-2xl ${isLiked ? 'text-app-pink' : 'text-white'}`}></i>
        </button>
        <span className="text-xs text-white font-medium mt-1">
          {formatCount(likesCount)}
        </span>
      </div>
      
      {/* Comment Button */}
      <div className="flex flex-col items-center">
        <button
          onClick={onComment}
          className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20 transition-all"
        >
          <i className="fas fa-comment text-white text-2xl"></i>
        </button>
        <span className="text-xs text-white font-medium mt-1">
          {formatCount(commentsCount)}
        </span>
      </div>
      
      {/* Share Button */}
      <div className="flex flex-col items-center">
        <button
          onClick={onShare}
          className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20 transition-all"
        >
          <i className="fas fa-share text-white text-2xl"></i>
        </button>
        <span className="text-xs text-white font-medium mt-1">Share</span>
      </div>
      
      {/* Music Disc */}
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-app-pink to-app-cyan animate-spin-slow flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
            <i className="fas fa-music text-white text-xs"></i>
          </div>
        </div>
      </div>
    </div>
  );
}
