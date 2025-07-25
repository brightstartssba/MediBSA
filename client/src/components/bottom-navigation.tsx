import { useLocation } from "wouter";

interface BottomNavigationProps {
  onCreateClick: () => void;
  currentUserId?: string;
}

export default function BottomNavigation({ onCreateClick, currentUserId }: BottomNavigationProps) {
  const [location, setLocation] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-50">
      <div className="flex items-center justify-around py-2">
        <button
          onClick={() => setLocation('/')}
          className="flex flex-col items-center py-2 px-4"
        >
          <i className={`fas fa-home text-xl mb-1 ${isActive('/') ? 'text-white' : 'text-app-gray'}`}></i>
          <span className={`text-xs font-medium ${isActive('/') ? 'text-white' : 'text-app-gray'}`}>
            Home
          </span>
        </button>
        
        <button className="flex flex-col items-center py-2 px-4">
          <i className="fas fa-compass text-app-gray text-xl mb-1"></i>
          <span className="text-xs text-app-gray">Discover</span>
        </button>
        
        <button
          onClick={onCreateClick}
          className="flex flex-col items-center py-2 px-4"
        >
          <div className="relative">
            <div className="w-8 h-8 bg-gradient-to-r from-app-pink to-app-cyan rounded-lg flex items-center justify-center">
              <i className="fas fa-plus text-white text-lg"></i>
            </div>
          </div>
          <span className="text-xs text-white font-medium mt-1">Create</span>
        </button>
        
        <button className="flex flex-col items-center py-2 px-4">
          <i className="fas fa-inbox text-app-gray text-xl mb-1"></i>
          <span className="text-xs text-app-gray">Inbox</span>
        </button>
        
        <button
          onClick={() => setLocation('/profile')}
          className="flex flex-col items-center py-2 px-4"
        >
          <i className={`fas fa-user text-xl mb-1 ${isActive('/profile') ? 'text-white' : 'text-app-gray'}`}></i>
          <span className={`text-xs font-medium ${isActive('/profile') ? 'text-white' : 'text-app-gray'}`}>
            Profile
          </span>
        </button>
      </div>
    </div>
  );
}
