import { FC } from 'react';
import { PlusIcon, BookOpenIcon } from 'lucide-react';
import { WoolBallIcon } from '../icons/WoolIcons';

interface NavigationProps {
  activeView: string;
  onNavigate: (view: 'input' | 'viewer' | 'library') => void;
}

const Navigation: FC<NavigationProps> = ({ activeView, onNavigate }) => {
  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <WoolBallIcon className="h-10 w-10 text-primary" />
              <h1 className="ml-2 text-2xl font-bold text-primary font-heading">Crochet Time</h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => onNavigate('input')}
              className="flex items-center px-4 py-2 rounded-full border border-primary-300 text-primary hover:bg-primary-100 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-1" />
              <span className="font-medium">New Pattern</span>
            </button>
            <button 
              onClick={() => onNavigate('library')}
              className="flex items-center px-4 py-2 rounded-full border border-secondary-300 text-secondary-600 hover:bg-secondary-100 transition-colors"
            >
              <BookOpenIcon className="h-5 w-5 mr-1" />
              <span className="font-medium">My Patterns</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
