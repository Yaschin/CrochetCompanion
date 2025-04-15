import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles, LifeBuoy } from 'lucide-react';
import { YarnIcon } from '../icons/WoolIcons';
import { cn } from '../lib/utils';

// Simple debounce function implementation
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

interface PatternGenLoaderProps {
  stage: 'prompt' | 'pattern' | 'images' | 'complete'; 
  progress?: number;
}

const PatternGenLoader: React.FC<PatternGenLoaderProps> = ({ stage, progress = 0 }) => {
  const stageLabels = {
    prompt: "Preparing your pattern...",
    pattern: "Crafting your instructions...",
    images: "Weaving your images...",
    complete: "Ready to crochet!"
  };

  const stagePercent = {
    prompt: 20,
    pattern: 60, 
    images: 90,
    complete: 100
  };

  const currentProgress = progress > 0 ? progress : stagePercent[stage];
  const debouncedProgress = useDebounce(currentProgress, 100);

  return (
    <div className="flex flex-col items-center justify-center p-6 my-4 bg-primary-50 rounded-xl border border-primary-100 will-change-transform">
      <div className="relative flex items-center mb-5">
        <YarnIcon className="animate-bounce text-primary h-6 w-6 mr-3" />
        <h3 className="text-lg font-medium text-primary-700">
          {stageLabels[stage]}
        </h3>
        {stage === 'complete' && (
          <Sparkles className="animate-pulse text-amber-500 h-5 w-5 ml-2" />
        )}
      </div>

      {/* Yarn-themed progress bar */}
      <div className="w-full max-w-md h-4 bg-gray-100 rounded-full overflow-hidden relative mb-3" role="progressbar" aria-valuenow={currentProgress} aria-valuemin={0} aria-valuemax={100}>
        <div 
          className="h-full bg-primary-400 transition-all duration-700 ease-in-out flex items-center"
          style={{ width: `${currentProgress}%` }}
        >
          {currentProgress > 10 && (
            <div className="h-2 w-2 bg-white rounded-full absolute animate-pulse" 
                style={{ left: '10px' }}></div>
          )}
        </div>

        {/* Animated crochet hook indicator */}
        <div 
          className="absolute top-0 transition-all duration-500 transform -translate-y-1/5"
          style={{ left: `${Math.min(98, currentProgress)}%` }}
        >
          {stage !== 'complete' && (
            <Loader2 className="h-6 w-6 text-primary-600 animate-spin" />
          )}
        </div>
      </div>

      {/* Percentage display */}
      <div className="text-sm text-primary-600 font-medium">
        {currentProgress}% {stage === 'complete' ? 'Complete!' : 'Complete'}
      </div>

      {/* Stage progress indicators */}
      <div className="mt-6 grid grid-cols-4 gap-2 w-full max-w-md">
        {['prompt', 'pattern', 'images', 'complete'].map((s) => (
          <div 
            key={s} 
            className={cn(
              "h-1 rounded-full transition-colors duration-300",
              stage === s ? "bg-primary animate-pulse" : 
              ['complete', 'images', 'pattern', 'prompt'].indexOf(stage) >= ['complete', 'images', 'pattern', 'prompt'].indexOf(s) 
                ? "bg-primary/30" 
                : "bg-gray-200"
            )}
          />
        ))}
      </div>
      
      {/* Current activity description */}
      <div className="mt-4 text-sm text-gray-500 italic flex items-center gap-2">
        {stage === 'prompt' && (
          <>
            <Sparkles className="h-4 w-4 animate-pulse" />
            <span>Converting your ideas into a crochet pattern...</span>
          </>
        )}
        {stage === 'pattern' && (
          <>
            <YarnIcon className="h-4 w-4 animate-spin" />
            <span>Designing sections and steps for your project...</span>
          </>
        )}
        {stage === 'images' && (
          <>
            <LifeBuoy className="h-4 w-4 animate-bounce" />
            <span>Generating visual guides for your pattern...</span>
          </>
        )}
        {stage === 'complete' && (
          <>
            <Sparkles className="h-4 w-4" />
            <span>All set! Your pattern is ready to view.</span>
          </>
        )}
      </div>
    </div>
  );
};

export default PatternGenLoader;