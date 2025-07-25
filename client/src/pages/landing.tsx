import { AuthForm } from "@/components/auth-form";
import { FirebaseConfigError } from "@/components/firebase-config-error";
import { useState, useEffect } from "react";

export default function Landing() {
  const [firebaseConfigured, setFirebaseConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    const checkFirebaseConfig = async () => {
      try {
        const response = await fetch('/api/config/firebase');
        const config = await response.json();
        setFirebaseConfigured(config.isConfigured);
      } catch (error) {
        console.error('Failed to check Firebase config:', error);
        setFirebaseConfigured(false);
      }
    };

    checkFirebaseConfig();
  }, []);

  if (firebaseConfigured === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!firebaseConfigured) {
    return <FirebaseConfigError />;
  }

  return <AuthForm />;
}
