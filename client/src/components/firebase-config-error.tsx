import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function FirebaseConfigError() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4">
        <Alert className="border-red-500/50 bg-red-950/50">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuration Required</AlertTitle>
          <AlertDescription className="mt-2">
            Firebase authentication is not properly configured. The app requires Firebase API keys to enable user authentication and social features.
          </AlertDescription>
        </Alert>
        
        <div className="bg-gray-900 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">
            Firebase Setup Required
          </h3>
          <p className="text-gray-300 text-sm">
            To use this TikTok-like video sharing app, you'll need to:
          </p>
          <ol className="text-gray-300 text-sm list-decimal list-inside space-y-2">
            <li>Create a Firebase project at <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-pink-400 underline">Firebase Console</a></li>
            <li>Enable Authentication with Email/Password</li>
            <li>Get your API keys from Project Settings</li>
            <li>Contact the administrator to configure the environment variables</li>
          </ol>
          
          <div className="mt-4 p-3 bg-gray-800 rounded text-xs text-gray-400">
            <strong>Required Environment Variables:</strong><br/>
            • FIREBASE_API_KEY<br/>
            • FIREBASE_AUTH_DOMAIN<br/>
            • FIREBASE_PROJECT_ID
          </div>
        </div>
      </div>
    </div>
  );
}