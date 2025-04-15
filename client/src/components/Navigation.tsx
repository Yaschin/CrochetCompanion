import { FC, useState } from 'react';
import { PlusIcon, BookOpenIcon } from 'lucide-react';
import { WoolBallIcon } from '../icons/WoolIcons';

interface NavigationProps {
  activeView: string;
  onNavigate: (view: 'input' | 'viewer' | 'library') => void;
}

const Navigation: FC<NavigationProps> = ({ activeView, onNavigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b">
      <Container>
        <div className="flex justify-between h-16">
          <div className="flex flex-shrink-0">
            <div className="flex-shrink-0 flex items-center">
              <WoolBallIcon className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
              <h1 className="ml-1 sm:ml-2 text-xl sm:text-2xl font-bold text-primary font-heading truncate">Crochet Time</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button 
              onClick={() => onNavigate('input')}
              className="flex items-center px-2 sm:px-4 py-1 sm:py-2 rounded-full border border-primary-300 text-primary hover:bg-primary-100 transition-colors"
            >
              <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-1" />
              <span className="hidden sm:inline font-medium">New Pattern</span>
            </button>
            <button 
              onClick={() => onNavigate('library')}
              className="flex items-center px-2 sm:px-4 py-1 sm:py-2 rounded-full border border-secondary-300 text-secondary-600 hover:bg-secondary-100 transition-colors"
            >
              <BookOpenIcon className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-1" />
              <span className="hidden sm:inline font-medium">My Patterns</span>
            </button>
          </div>
        </div>
      </Container>
    </nav>
  );
};

export default Navigation;