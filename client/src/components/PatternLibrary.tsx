import { FC, useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Pattern } from '../lib/types';
import { FolderOpen, Trash, Calendar, Plus, Search } from 'lucide-react';

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

  // Fetch all patterns with better error handling and retry logic
  const { data: patterns, isLoading, isError } = useQuery({
    queryKey: ['/api/patterns'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/patterns');
        if (!response.ok) {
          throw new Error(`Failed to fetch patterns: ${response.statusText}`);
        }
        return await response.json();
      } catch (err) {
        console.error("Error fetching patterns:", err);
        throw err;
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
    staleTime: 1000 * 60 * 2, // 2 minutes (data considered fresh)
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
    ((patterns as Pattern[]) || []).forEach((p) => p.projectType && set.add(p.projectType));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [patterns]);

  // Apply search + type filter + sort (all client-side over fetched patterns)
  const visiblePatterns = useMemo(() => {
    let list = [...((patterns as Pattern[]) || [])];

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
  }, [patterns, search, typeFilter, sort]);

  const hasPatterns = !!patterns && patterns.length > 0;
  const selectClass =
    "rounded-full border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="surface-card mb-8 p-5 sm:p-7">
      <h2 className="mb-6 font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">My Pattern Library</h2>

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
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {visiblePatterns.map((pattern) => {
                const progressPercent = progressOf(pattern);
                return (
                  <div
                    key={pattern.id}
                    className="cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-card shadow-sm transition-shadow hover:shadow-md"
                    onClick={() => onPatternSelected(pattern)}
                  >
                    <div className="h-48 overflow-hidden bg-gray-100">
                      {pattern.endProductImage ? (
                        <img src={pattern.endProductImage} alt={pattern.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-400">
                          <span>No image available</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-heading text-lg font-semibold text-foreground">{pattern.title}</h3>
                      <div className="mb-3 mt-2 flex flex-wrap gap-2">
                        <span className="inline-flex items-center rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800">
                          {pattern.projectType}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-secondary-100 px-2.5 py-0.5 text-xs font-medium text-secondary-800">
                          {pattern.skillLevel}
                        </span>
                      </div>
                      <div className="flex text-sm text-gray-500">
                        <Calendar className="mr-1 h-5 w-5 text-gray-400" />
                        Created {formatDate(pattern.createdAt)}
                      </div>
                      <div className="mt-4 flex justify-between">
                        <div className="text-sm">
                          <div className="flex items-center text-gray-500">
                            <span>Progress:</span>
                            <span className="ml-1 font-medium text-primary-600">{progressPercent}%</span>
                          </div>
                          <div className="mt-1 h-1.5 w-24 rounded-full bg-gray-200">
                            <div className="h-1.5 rounded-full bg-primary" style={{ width: `${progressPercent}%` }} />
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            className="inline-flex items-center rounded-full border border-transparent bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary-600"
                            onClick={(e) => { e.stopPropagation(); onPatternSelected(pattern); }}
                          >
                            Open
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center rounded-full border border-transparent px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
                            onClick={(e) => handleDeletePattern(pattern.id, e)}
                            aria-label="Delete pattern"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
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
