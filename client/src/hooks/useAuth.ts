import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import { apiRequest } from '@/lib/queryClient';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const auth = await getFirebaseAuth();
        
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            try {
              // Create or update user in database
              const token = await firebaseUser.getIdToken();
              await apiRequest('POST', '/api/auth/verify', {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User'
              });
              setUser(firebaseUser);
            } catch (error) {
              console.error('Error verifying user:', error);
              setUser(null);
            }
          } else {
            setUser(null);
          }
          setIsLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        // Set loading to false so the app can display the error state
        setIsLoading(false);
        setUser(null);
      }
    };

    const unsubscribePromise = initAuth();
    
    return () => {
      unsubscribePromise.then(unsubscribe => {
        if (unsubscribe) unsubscribe();
      });
    };
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
