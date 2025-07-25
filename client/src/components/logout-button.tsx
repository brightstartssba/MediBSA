import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      const auth = await getFirebaseAuth();
      await signOut(auth);
      toast({
        title: "Success",
        description: "Logged out successfully"
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive"
      });
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleLogout}
      className="text-white hover:bg-white/20"
    >
      <LogOut className="h-5 w-5" />
    </Button>
  );
}