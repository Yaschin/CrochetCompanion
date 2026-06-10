import { FC, useMemo } from 'react';
import { PatternSection } from '../lib/types';

interface PatternProgressBarProps {
  sections: PatternSection[];
}

const PatternProgressBar: FC<PatternProgressBarProps> = ({ sections }) => {
  const { completedSteps, totalSteps, percentComplete } = useMemo(() => {
    let completed = 0;
    let total = 0;

    // Count completed steps across crochet sections (materials checklists
    // are not rounds — keep the denominator consistent with lib/progress).
    sections.filter(section => section.name.toLowerCase() !== 'materials').forEach(section => {
      section.steps.forEach(step => {
        total++;
        if (step.completed) {
          completed++;
        }
      });
    });

    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      completedSteps: completed,
      totalSteps: total,
      percentComplete: percent
    };
  }, [sections]);

  return (
    <div className="mb-8">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-secondary-600">Progress</span>
        <span className="text-sm font-medium text-secondary-600">
          {completedSteps} of {totalSteps} steps completed
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-primary h-2.5 rounded-full" 
          style={{ width: `${percentComplete}%` }}
        />
      </div>
    </div>
  );
};

export default PatternProgressBar;
