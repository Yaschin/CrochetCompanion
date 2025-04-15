import React from 'react';
import { Loader2, Sparkles, LifeBuoy } from 'lucide-react';
import { YarnIcon } from '../icons/WoolIcons';

interface PatternGenLoaderProps {
  stage: 'prompt' | 'pattern' | 'images' | 'complete'; 
  progress?: number;
}

const PatternGenLoader: React.FC<PatternGenLoaderProps> = React.memo(({ stage, progress = 0 }) => {
  const stageLabels = React.useMemo(() => ({
    prompt: "Preparing your pattern...",
    pattern: "Crafting your instructions...",
    images: "Weaving your images...",
    complete: "Ready to crochet!"
  }), []);

  const stagePercent = {
    prompt: 20,
    pattern: 60, 
    images: 90,
    complete: 100
  };

  const currentProgress = useMemo(() => 
    progress > 0 ? progress : stagePercent[stage],
    [progress, stage]
  );

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
      <div className="w-full max-w-md h-4 bg-gray-100 rounded-full overflow-hidden relative mb-3">
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
          className={`absolute top-0 transition-all duration-500 transform -translate-y-1/5`}
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

      {/* Current activity description */}
      <div className="mt-4 text-sm text-gray-500 italic">
        {stage === 'prompt' && "Converting your ideas into a crochet pattern..."}
        {stage === 'pattern' && "Designing sections and steps for your project..."}
        {stage === 'images' && "Generating visual guides for your pattern..."}
        {stage === 'complete' && "All set! Your pattern is ready to view."}
      </div>
    </div>
  );
};

export default PatternGenLoader;