interface TopHeaderProps {
  currentTab: 'following' | 'forYou';
  onTabChange: (tab: 'following' | 'forYou') => void;
}

export default function TopHeader({ currentTab, onTabChange }: TopHeaderProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-40 backdrop-blur-lg bg-black/30 border-b border-gray-800">
      <div className="flex items-center justify-between p-4">
        {/* Live/Following Toggle */}
        <div className="flex items-center space-x-6">
          <button
            onClick={() => onTabChange('following')}
            className={`text-lg font-medium transition-colors ${
              currentTab === 'following' ? 'text-white' : 'text-app-gray'
            }`}
          >
            Following
          </button>
          <button
            onClick={() => onTabChange('forYou')}
            className={`text-lg font-bold transition-colors ${
              currentTab === 'forYou' ? 'text-white' : 'text-app-gray'
            }`}
          >
            For You
          </button>
        </div>
        
        {/* Search */}
        <button className="text-white">
          <i className="fas fa-search text-xl"></i>
        </button>
      </div>
    </div>
  );
}
