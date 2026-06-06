import { FC } from 'react';
import { PlusIcon, BookOpenIcon, PackageIcon, HomeIcon } from 'lucide-react';
import { cn } from '../lib/utils';

type View = 'home' | 'input' | 'viewer' | 'library' | 'stash';

interface NavigationProps {
  activeView: string;
  onNavigate: (view: View) => void;
}

const NAV_ITEMS: { view: View; label: string; icon: typeof PlusIcon }[] = [
  { view: 'home', label: 'Home', icon: HomeIcon },
  { view: 'input', label: 'New Pattern', icon: PlusIcon },
  { view: 'library', label: 'My Patterns', icon: BookOpenIcon },
  { view: 'stash', label: 'Materials', icon: PackageIcon },
];

const Navigation: FC<NavigationProps> = ({ activeView, onNavigate }) => {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/65">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <button
          onClick={() => onNavigate('home')}
          className="flex min-w-0 shrink-0 items-center gap-2 rounded-full focus-visible:outline-none"
          aria-label="Crochet Time — home"
        >
          <span
            className="shrink-0 leading-none select-none"
            style={{
              fontFamily: "'Dancing Script', cursive",
              fontSize: '1.75rem',
              fontWeight: 700,
              color: '#6B3A4A',
              lineHeight: 1,
            }}
          >
            Crochet Time
            <span style={{ color: '#C24E6B' }}>♥</span>
          </span>
        </button>

        {/* Nav */}
        <div className="ml-auto flex min-w-0 items-center gap-1.5 overflow-x-auto sm:gap-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NAV_ITEMS.map(({ view, label, icon: Icon }) => {
            const active = activeView === view;
            return (
              <button
                key={view}
                onClick={() => onNavigate(view)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-sm font-medium transition-colors sm:px-3.5',
                  active
                    ? 'border-primary-200 bg-primary-50 text-primary-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-800',
                )}
              >
                <Icon className="h-4 w-4 shrink-0 sm:h-[18px] sm:w-[18px]" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
