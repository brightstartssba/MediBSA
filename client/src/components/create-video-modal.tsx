import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Upload, X, Video } from "lucide-react";

interface CreateVideoModalProps {
  onClose: () => void;
}

export default function CreateVideoModal({ onClose }: CreateVideoModalProps) {
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [videoUrl, setVideoUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createVideoMutation = useMutation({
    mutationFn: async (data: any) => {
      if (uploadMethod === 'file' && selectedFile) {
        const formData = new FormData();
        formData.append('video', selectedFile);
        formData.append('description', data.description);
        formData.append('isPublic', data.isPublic.toString());
        
        const response = await fetch('/api/videos/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${await (window as any).firebaseAuthInstance?.currentUser?.getIdToken()}`,
            'x-user-id': (window as any).firebaseAuthInstance?.currentUser?.uid,
          },
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }
        
        return response.json();
      } else {
        await apiRequest("POST", "/api/videos", data);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Video uploaded successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/videos/feed"] });
      onClose();
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
        description: "Failed to upload video. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Video file size must be less than 100MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = () => {
    if (uploadMethod === 'file') {
      if (!selectedFile) {
        toast({
          title: "Error",
          description: "Please select a video file",
          variant: "destructive",
        });
        return;
      }
    } else {
      if (!videoUrl.trim()) {
        toast({
          title: "Error",
          description: "Please provide a video URL",
          variant: "destructive",
        });
        return;
      }
    }

    const videoData = {
      title: description.split('\n')[0] || "Untitled Video",
      description,
      isPublic,
      ...(uploadMethod === 'url' && { videoUrl }),
    };
    
    createVideoMutation.mutate(videoData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="bg-app-dark rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Create Video</h2>
          <button
            onClick={onClose}
            className="text-app-gray hover:text-white"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>
        
        {/* Upload Method Selection */}
        <div className="flex space-x-2 mb-6">
          <button
            type="button"
            onClick={() => setUploadMethod('file')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              uploadMethod === 'file'
                ? 'bg-app-pink text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setUploadMethod('url')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              uploadMethod === 'url'
                ? 'bg-app-pink text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Video className="w-4 h-4 inline mr-2" />
            Video URL
          </button>
        </div>

        {/* Upload Area */}
        <div className="border-2 border-dashed border-app-gray rounded-xl p-8 text-center mb-6">
          {uploadMethod === 'file' ? (
            <>
              <Upload className="w-12 h-12 text-app-gray mx-auto mb-4" />
              <p className="text-white mb-2">Upload Video File</p>
              <p className="text-gray-400 text-sm mb-4">MP4, AVI, MOV (Max 100MB)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="mb-2"
              >
                Choose File
              </Button>
              {selectedFile && (
                <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white truncate">
                      {selectedFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="text-red-400 hover:text-red-300 ml-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <Video className="w-12 h-12 text-app-gray mx-auto mb-4" />
              <p className="text-white mb-2">Video URL</p>
              <input
                type="url"
                placeholder="https://example.com/video.mp4"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full bg-gray-800 text-white rounded-lg p-3 mt-2 focus:outline-none focus:ring-2 focus:ring-app-pink"
              />
            </>
          )}
        </div>
        
        {/* Video Details */}
        <div className="space-y-4">
          <div>
            <label className="block text-white text-sm font-medium mb-2">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-lg p-3 resize-none border-gray-600 focus:border-app-pink"
              rows={3}
              placeholder="Write a caption..."
            />
          </div>
          
          {/* Privacy Settings */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">Who can view this video</label>
            <select
              value={isPublic ? 'public' : 'private'}
              onChange={(e) => setIsPublic(e.target.value === 'public')}
              className="w-full bg-gray-800 text-white rounded-lg p-3 border-gray-600 focus:border-app-pink"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 bg-gray-800 text-white border-gray-600 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createVideoMutation.isPending}
              className="flex-1 bg-app-pink text-white hover:bg-pink-600"
            >
              {createVideoMutation.isPending ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
