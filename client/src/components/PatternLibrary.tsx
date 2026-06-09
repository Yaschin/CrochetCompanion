import { FC, useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Pattern } from '../lib/types';
import { cn } from '../lib/utils';
import { FolderOpen, Trash, Calendar, Plus, Search, Heart } from 'lucide-react';
import { PatternThumb } from '@/components/PatternThumb';

interface PatternLibraryProps {
  onPatternSelected: (pattern: Pattern) => void;
  onCreateNew: () => void;
}

type SortKey = 'newest' | 'oldest' | 'title' | 'progress';

// Progress percentage across all steps in a pattern
const progressOf = (pattern: Pattern) => {
  let completed = 0;
  let total = 0;
  pattern.sections.forEach((section) => {
    section.steps.forEach((step) => {
      total++;
      if (step.completed) completed++;
    });
  });
  return total > 0 ? Math.round((completed / total) * 100) : 0;
};

const PatternLibrary: FC<PatternLibraryProps> = ({ onPatternSelected, onCreateNew }) => {
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sort, setSort] = useState<SortKey>('newest');
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  // Fetch all patterns — uses the global default fetcher so all screens share
  // the same cache behaviour. retry/retryDelay kept for resilience.
  const { data: patterns, isLoading, isError } = useQuery<Pattern[]>({
    queryKey: ['/api/patterns'],
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // Delete pattern mutation
  const deletePatternMutation = useMutation({
    mutationFn: async (patternId: string) => {
      await apiRequest('DELETE', `/api/patterns/${patternId}`);
      return patternId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/patterns'] });
      toast({
        title: "Pattern Deleted",
        description: "The pattern has been removed from your library.",
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "There was an error deleting the pattern.",
        variant: "destructive",
      });
    },
  });

  // Toggle Larissa's Favorites
  const favoriteMutation = useMutation({
    mutationFn: async ({ id, favorite }: { id: string; favorite: boolean }) => {
      const res = await apiRequest('PUT', `/api/patterns/${id}`, { favorite });
      if (!res.ok) throw new Error('Failed to update favorite');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/patterns'] }),
    onError: () => toast({ title: 'Could not update favorite', variant: 'destructive' }),
  });

  const toggleFavorite = (pattern: Pattern, event: React.MouseEvent) => {
    event.stopPropagation();
    favoriteMutation.mutate({ id: pattern.id, favorite: !pattern.favorite });
  };

  const handleDeletePattern = (patternId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm("Are you sure you want to delete this pattern? This action cannot be undone.")) {
      deletePatternMutation.mutate(patternId);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Unique project types for the filter dropdown
  const projectTypes = useMemo(() => {
    const set = new Set<string>();
    (patterns || []).forEach((p) => p.projectType && set.add(p.projectType));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [patterns]);

  // Apply search + type filter + sort (all client-side over fetched patterns)
  const visiblePatterns = useMemo(() => {
    let list = [...(patterns || [])];

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((p) =>
        p.title?.toLowerCase().includes(q) ||
        p.projectType?.toLowerCase().includes(q) ||
        p.skillLevel?.toLowerCase().includes(q),
      );
    }

    if (typeFilter !== 'all') {
      list = list.filter((p) => p.projectType === typeFilter);
    }

    if (favoritesOnly) {
      list = list.filter((p) => p.favorite);
    }

    list.sort((a, b) => {
      switch (sort) {
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'progress':
          return progressOf(b) - progressOf(a);
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return list;
  }, [patterns, search, typeFilter, sort, favoritesOnly]);

  const hasPatterns = !!patterns && patterns.length > 0;
  const selectClass =
    "rounded-full border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="mb-8">
      <h2 className="mb-4 font-heading text-[20px] font-bold" style={{ color: "#3D2318" }}>My Patterns</h2>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center py-8 text-center text-destructive">
          <svg xmlns="http://www.w3.org/2000/svg" className="mb-2 h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="font-medium">Error loading patterns</p>
          <p className="mt-1 text-sm text-destructive/70">Please try refreshing the page</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary-600"
          >
            Refresh Page
          </button>
        </div>
      ) : hasPatterns ? (
        <>
          {/* Search · filter · sort */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patterns…"
                aria-label="Search patterns"
                className="w-full rounded-full border border-input bg-background py-2 pl-9 pr-4 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <button
              type="button"
              onClick={() => setFavoritesOnly((v) => !v)}
              aria-pressed={favoritesOnly}
              className={cn(
                'inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition-colors',
                favoritesOnly ? 'border-primary-200 bg-primary-50 text-primary-700' : 'border-input text-gray-600 hover:bg-gray-100',
              )}
            >
              <Heart className={cn('h-4 w-4', favoritesOnly && 'fill-primary text-primary')} />
              Favorites
            </button>
            <select aria-label="Filter by type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={selectClass}>
              <option value="all">All types</option>
              {projectTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select aria-label="Sort patterns" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={selectClass}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="title">Title A–Z</option>
              <option value="progress">Most progress</option>
            </select>
          </div>

          {visiblePatterns.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {visiblePatterns.map((pattern) => {
                const progressPercent = progressOf(pattern);
                return (
                  <div
                    key={pattern.id}
                    className="cursor-pointer overflow-hidden rounded-2xl transition-all hover:scale-[1.02]"
                    style={{ background: "rgba(255,252,245,0.95)", boxShadow: "0 2px 12px rgba(80,40,10,0.10)", border: "1px solid rgba(140,100,55,0.12)" }}
                    onClick={() => onPatternSelected(pattern)}
                  >
                    {/* Square image */}
                    <div className="relative aspect-square overflow-hidden" style={{ containerType: "inline-size" }}>
                      <PatternThumb image={pattern.endProductImage} title={pattern.title} projectType={pattern.projectType} />
                      {/* Heart */}
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(pattern, e)}
                        aria-label={pattern.favorite ? 'Remove from favorites' : 'Add to favorites'}
                        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full"
                        style={{ background: "rgba(255,252,245,0.9)" }}
                      >
                        <Heart className={cn('h-3.5 w-3.5', pattern.favorite ? 'fill-current' : '')} style={{ color: "#C24E6B" }} />
                      </button>
                      {/* Progress bar overlay */}
                      {progressPercent > 0 && (
                        <div className="absolute bottom-0 left-0 right-0" style={{ height: 3, background: "rgba(0,0,0,0.15)" }}>
                          <div style={{ height: "100%", width: `${progressPercent}%`, background: "#84934F" }} />
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="px-2 py-2">
                      <p className="font-heading font-bold text-[12px] leading-tight truncate" style={{ color: "#3D2318" }}>
                        {pattern.title}
                      </p>
                      <p className="text-[10px] mt-0.5 truncate" style={{ color: "#9A7868" }}>
                        {pattern.projectType} · {pattern.skillLevel}
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] font-semibold" style={{ color: "#84934F" }}>{progressPercent}%</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleDeletePattern(pattern.id, e); }}
                          className="w-5 h-5 flex items-center justify-center rounded-full hover:opacity-80"
                          style={{ color: "#B0908A" }}
                        >
                          <Trash className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">
              <p className="font-medium text-foreground">No patterns match your search</p>
              <p className="mt-1 text-sm">Try a different term or clear the filters.</p>
            </div>
          )}
        </>
      ) : (
        <div className="py-12 text-center">
          <div className="mx-auto h-24 w-24 text-gray-400">
            <FolderOpen className="h-full w-full" />
          </div>
          <h3 className="mt-2 font-heading text-lg font-medium text-foreground">No patterns yet</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating your first crochet pattern!</p>
          <div className="mt-6">
            <button
              type="button"
              className="inline-flex items-center rounded-full border border-transparent bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary-600 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={onCreateNew}
            >
              <Plus className="mr-2 h-5 w-5" />
              Create New Pattern
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatternLibrary;
