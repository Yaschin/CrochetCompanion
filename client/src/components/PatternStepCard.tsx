// This component has been superseded by the StepRow component inside PatternSection.tsx
// As part of the UI redesign to make the pattern view more compact and intuitive

import { PatternStep } from '../lib/types';

interface PatternStepCardProps {
  step: PatternStep;
  stepNumber: number;
  onUpdate: (updatedStep: PatternStep) => void;
  onDelete: () => void;
}

// This is now just a redirect/wrapper around the StepRow component in PatternSection
const PatternStepCard: React.FC<PatternStepCardProps> = ({
  step,
  stepNumber,
  onUpdate,
  onDelete
}) => {
  // The component is intentionally empty as part of the refactoring
  // The functionality has been moved to StepRow in PatternSection.tsx
  return null;
};

export default PatternStepCard;
