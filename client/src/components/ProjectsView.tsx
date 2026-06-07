import { FC, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Pattern } from '../lib/types';
import { cn } from '../lib/utils';
import { ListChecks, CheckCircle2, ArrowRight } from 'lucide-react';

interface ProjectsViewProps {
  onPatternSelected: (pattern: Pattern) => void;
  onBrowse: () => void;
}

const progressOf = (p: Pattern) => {
  let done = 0;
  let total = 0;
  p.sections.forEach((s) => s.steps.forEach((st) => { total++; if (st.completed) done++; }));
  return total > 0 ? Math.round((done / total) * 100) : 0;
};

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

const ProjectCard: FC<{ pattern: Pattern; onOpen: () => void; finished?: boolean }> = ({ pattern, onOpen, finished }) => {
  const pct = progressOf(pattern);
  return (
    <div
      onClick={onOpen}
      className="flex cursor-pointer gap-3 overflow-hidden rounded-xl border border-gray-200 bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
        {pattern.endProductImage ? (
          <img src={pattern.endProductImage} alt={pattern.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400"><ListChecks className="h-6 w-6" /></div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="truncate font-heading text-base font-semibold text-foreground">{pattern.title}</h3>
        <p className="mt-0.5 text-xs text-gray-500">
          {finished
            ? `Finished ${fmtDate(pattern.finishedAt)}`
            : `Started ${fmtDate(pattern.startedAt)}`}
        </p>
        <div className="mt-auto flex items-center gap-2 pt-2">
          <div className="h-1.5 flex-1 rounded-full bg-gray-200">
            <div className={cn('h-1.5 rounded-full', finished ? 'bg-secondary-500' : 'bg-primary')} style={{ width: `${pct}%` }} />
          </div>
          <span className="shrink-0 text-xs font-medium text-gray-500">{pct}%</span>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 self-center text-gray-300" />
    </div>
  );
};

const ProjectsView: FC<ProjectsViewProps> = ({ onPatternSelected, onBrowse }) => {
  const { data: patterns, isLoading, isError } = useQuery<Pattern[]>({
    queryKey: ['/api/patterns'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/patterns');
      if (!res.ok) throw new Error('Failed to load projects');
      return res.json();
    },
    staleTime: 1000 * 60 * 2,
  });

  const active = useMemo(
    () => ((patterns as Pattern[]) || [])
      .filter((p) => p.status === 'active')
      .sort((a, b) => new Date(b.startedAt || 0).getTime() - new Date(a.startedAt || 0).getTime()),
    [patterns],
  );
  const finished = useMemo(
    () => ((patterns as Pattern[]) || [])
      .filter((p) => p.status === 'finished')
      .sort((a, b) => new Date(b.finishedAt || 0).getTime() - new Date(a.finishedAt || 0).getTime()),
    [patterns],
  );

  const hasAny = active.length > 0 || finished.length > 0;

  return (
    <div className="surface-card mb-8 p-5 sm:p-7">
      <h2 className="mb-6 font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">My Projects</h2>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      ) : isError ? (
        <p className="py-8 text-center text-destructive">Couldn&rsquo;t load your projects. Please refresh.</p>
      ) : !hasAny ? (
        <div className="py-12 text-center">
          <ListChecks className="mx-auto h-16 w-16 text-gray-300" />
          <h3 className="mt-3 font-heading text-lg font-medium text-foreground">No projects yet</h3>
          <p className="mt-1 text-sm text-gray-500">Open a pattern and tap &ldquo;Start project&rdquo; to begin tracking your progress here.</p>
          <button
            onClick={onBrowse}
            className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary-600"
          >
            Browse patterns
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary-700">
                <span className="h-2 w-2 rounded-full bg-primary" /> In progress
                <span className="font-normal text-gray-400">({active.length})</span>
              </h3>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {active.map((p) => <ProjectCard key={p.id} pattern={p} onOpen={() => onPatternSelected(p)} />)}
              </div>
            </section>
          )}

          {finished.length > 0 && (
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-secondary-700">
                <CheckCircle2 className="h-4 w-4" /> Finished
                <span className="font-normal text-gray-400">({finished.length})</span>
              </h3>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {finished.map((p) => <ProjectCard key={p.id} pattern={p} onOpen={() => onPatternSelected(p)} finished />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectsView;
