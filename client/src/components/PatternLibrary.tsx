import { FC, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Pattern } from '../lib/types';
import { FolderOpen, Trash, Calendar, Plus } from 'lucide-react';

interface PatternLibraryProps {
  onPatternSelected: (pattern: Pattern) => void;
  onCreateNew: () => void;
}

const PatternLibrary: FC<PatternLibraryProps> = ({ onPatternSelected, onCreateNew }) => {
  const { toast } = useToast();
  
  // Fetch all patterns with better error handling and retry logic
  const { data: patterns, isLoading, isError, error } = useQuery({
    queryKey: ['/api/patterns'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/patterns');
        if (!response.ok) {
          throw new Error(`Failed to fetch patterns: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
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
      // Invalidate the patterns cache to trigger a refetch
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

  // Handle pattern deletion
  const handleDeletePattern = (patternId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (window.confirm("Are you sure you want to delete this pattern? This action cannot be undone.")) {
      deletePatternMutation.mutate(patternId);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Calculate progress percentage
  const calculateProgress = (pattern: Pattern) => {
    let completedCount = 0;
    let totalCount = 0;

    pattern.sections.forEach(section => {
      section.steps.forEach(step => {
        totalCount++;
        if (step.completed) {
          completedCount++;
        }
      });
    });

    return totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  };

  return (
    <div className="bg-white shadow-md rounded-2xl p-6 mb-8">
      <h2 className="text-2xl font-bold text-secondary-600 font-heading mb-6">My Pattern Library</h2>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : isError ? (
        <div className="text-center py-8 text-red-500 flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="font-medium">Error loading patterns</p>
          <p className="text-sm mt-1 text-red-400">Please try refreshing the page</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary-600 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      ) : patterns && patterns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {patterns.map((pattern: Pattern) => {
            const progressPercent = calculateProgress(pattern);
            
            return (
              <div 
                key={pattern.id}
                className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onPatternSelected(pattern)}
              >
                <div className="h-48 overflow-hidden bg-gray-100">
                  {pattern.endProductImage ? (
                    <img 
                      src={pattern.endProductImage} 
                      alt={pattern.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <span>No image available</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold text-secondary-700 font-heading">{pattern.title}</h3>
                  <div className="flex flex-wrap gap-2 mt-2 mb-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      {pattern.projectType}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {pattern.skillLevel}
                    </span>
                  </div>
                  <div className="flex text-sm text-secondary-500">
                    <Calendar className="h-5 w-5 mr-1 text-secondary-400" />
                    Created {formatDate(pattern.createdAt)}
                  </div>
                  <div className="mt-4 flex justify-between">
                    <div className="text-sm">
                      <div className="flex items-center text-secondary-500">
                        <span>Progress:</span>
                        <span className="ml-1 font-medium text-primary-600">{progressPercent}%</span>
                      </div>
                      <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-primary h-1.5 rounded-full" 
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        type="button" 
                        className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-full text-xs font-medium text-white bg-primary hover:bg-primary-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPatternSelected(pattern);
                        }}
                      >
                        Open
                      </button>
                      <button 
                        type="button" 
                        className="inline-flex items-center px-2 py-1.5 border border-transparent rounded-full text-xs font-medium text-secondary-600 hover:bg-secondary-100"
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
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 text-secondary-400">
            <FolderOpen className="h-full w-full" />
          </div>
          <h3 className="mt-2 text-lg font-medium text-secondary-600 font-heading">No patterns yet</h3>
          <p className="mt-1 text-sm text-secondary-500">Get started by creating your first crochet pattern!</p>
          <div className="mt-6">
            <button 
              type="button" 
              className="inline-flex items-center px-6 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              onClick={onCreateNew}
            >
              <Plus className="h-5 w-5 mr-2" />
              Create New Pattern
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatternLibrary;
