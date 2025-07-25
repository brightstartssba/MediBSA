import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface CommentsModalProps {
  videoId: string;
  onClose: () => void;
}

export default function CommentsModal({ videoId, onClose }: CommentsModalProps) {
  const [newComment, setNewComment] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["/api/videos", videoId, "comments"],
    retry: false,
  });

  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiRequest("POST", `/api/videos/${videoId}/comments`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos", videoId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/videos/feed"] });
      setNewComment("");
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
        description: "Failed to post comment",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    createCommentMutation.mutate(newComment.trim());
  };

  const getRelativeTime = (date: string) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - commentDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
      <div className="bg-app-dark rounded-t-3xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Comments</h3>
            <button
              onClick={onClose}
              className="text-app-gray hover:text-white"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
        </div>
        
        {/* Comments List */}
        <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-4">
              <div className="text-app-gray">Loading comments...</div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <i className="fas fa-comments text-4xl text-app-gray mb-4"></i>
              <p className="text-app-gray">No comments yet</p>
              <p className="text-sm text-app-gray mt-2">Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment: any) => (
              <div key={comment.id} className="flex space-x-3">
                <img
                  src={comment.user?.profileImageUrl || "https://via.placeholder.com/32"}
                  alt="Commenter avatar"
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-medium text-sm">
                      {comment.user?.username || 'Anonymous'}
                    </span>
                    <span className="text-app-gray text-xs">
                      {comment.createdAt ? getRelativeTime(comment.createdAt) : 'now'}
                    </span>
                  </div>
                  <p className="text-white text-sm mt-1">{comment.content}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <button className="text-app-gray text-xs hover:text-white">Reply</button>
                    <button className="flex items-center space-x-1 text-app-gray text-xs hover:text-white">
                      <i className="fas fa-heart"></i>
                      <span>{comment.likesCount || 0}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Comment Input */}
        <div className="p-4 border-t border-gray-800 flex items-center space-x-3">
          <img
            src={user?.profileImageUrl || "https://via.placeholder.com/32"}
            alt="Your avatar"
            className="w-8 h-8 rounded-full object-cover"
          />
          <div className="flex-1 flex items-center space-x-2">
            <input
              type="text"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              className="flex-1 bg-gray-800 text-white rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-app-pink"
            />
            <button
              onClick={handleSubmit}
              disabled={createCommentMutation.isPending || !newComment.trim()}
              className="text-app-pink hover:text-pink-400 disabled:text-app-gray disabled:cursor-not-allowed"
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
