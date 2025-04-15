import React, { useState } from 'react';
import { PatternIcon } from '../icons/WoolIcons';

interface DifficultyLevel {
  id: string;
  label: string;
  emoji: string;
  description: string;
}

interface DifficultySelectorProps {
  selectedLevel: string;
  onSelect: (level: string) => void;
}

const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  {
    id: 'beginner',
    label: 'Easy',
    emoji: '😀',
    description: 'Perfect for beginners – simple and fun!'
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    emoji: '😐',
    description: 'Moderate challenge with some stitch complexities.'
  },
  {
    id: 'advanced',
    label: 'Advanced',
    emoji: '😓',
    description: 'Expert-level, with detailed techniques and precision.'
  }
];

const DifficultySelector: React.FC<DifficultySelectorProps> = ({ selectedLevel, onSelect }) => {
  const [showDescription, setShowDescription] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <label className="flex items-center text-sm font-medium text-secondary-600">
        <PatternIcon className="wool-icon h-5 w-5 mr-1 text-primary-400" />
        Skill Level
      </label>
      
      <div className="flex flex-wrap gap-2">
        {DIFFICULTY_LEVELS.map((level) => (
          <button
            key={level.id}
            type="button"
            className={`flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border transition-all duration-200 ${
              selectedLevel === level.id
                ? 'border-primary-500 bg-primary-50 text-primary-800 shadow-sm'
                : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
            }`}
            onClick={() => onSelect(level.id)}
            onMouseEnter={() => setShowDescription(level.id)}
            onMouseLeave={() => setShowDescription(null)}
            title={level.description}
          >
            <span className="text-xl mr-2">{level.emoji}</span>
            <span className="text-sm font-medium">{level.label}</span>
          </button>
        ))}
      </div>
      
      {/* Description text below selection */}
      {selectedLevel && (
        <p className="text-xs text-gray-600 italic mt-1 pl-1">
          {DIFFICULTY_LEVELS.find(level => level.id === selectedLevel)?.description}
        </p>
      )}
    </div>
  );
};

export default DifficultySelector;