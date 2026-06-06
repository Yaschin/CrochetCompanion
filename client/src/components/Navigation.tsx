import { FC } from 'react';
import { PlusIcon, BookOpenIcon, PackageIcon, CalendarIcon } from 'lucide-react';
import { WoolBallIcon } from '../icons/WoolIcons';
import { cn } from '../lib/utils';

type View = 'input' | 'viewer' | 'library' | 'stash' | 'calendar';

interface NavigationProps {
  activeView: string;
  onNavigate: (view: View) => void;
}

const NAV_ITEMS: { view: View; label: string; icon: typeof PlusIcon }[] = [
  { view: 'input', label: 'New Pattern', icon: PlusIcon },
  { view: 'library', label: 'My Patterns', icon: BookOpenIcon },
  { view: 'stash', label: 'My Stash', icon: PackageIcon },
  { view: 'calendar', label: 'Planner', icon: CalendarIcon },
];

const Navigation: FC<NavigationProps> = ({ activeView, onNavigate }) => {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/65">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <button
          onClick={() => onNavigate('input')}
          className="flex min-w-0 shrink-0 items-center gap-2 rounded-full focus-visible:outline-none"
          aria-label="Crochet Time — new pattern"
        >
          <WoolBallIcon className="h-8 w-8 shrink-0 text-primary motion-safe:animate-yarn-float sm:h-9 sm:w-9" />
          <span className="truncate font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Crochet&nbsp;Time
          </span>
        </button>

        {/* Nav — scrolls horizontally on small screens instead of overlapping */}
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
