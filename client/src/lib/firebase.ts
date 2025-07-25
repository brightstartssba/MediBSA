import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

let firebaseConfig: any = null;
let app: any = null;
let auth: any = null;

// Function to initialize Firebase with config from server
export const initializeFirebase = async () => {
  if (app) return { app, auth };
  
  try {
    const response = await fetch('/api/config/firebase');
    firebaseConfig = await response.json();
    
    // Check if Firebase is properly configured
    if (!firebaseConfig.isConfigured) {
      throw new Error('Firebase configuration is missing. Please contact the administrator to configure Firebase API keys.');
    }
    
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    
    // Store auth instance globally for API requests
    (window as any).firebaseAuthInstance = auth;
    
    return { app, auth };
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    throw error;
  }
};

// Export a promise that resolves to auth
export const getFirebaseAuth = async () => {
  if (auth) return auth;
  const { auth: firebaseAuth } = await initializeFirebase();
  return firebaseAuth;
};

export { auth };
export default app;