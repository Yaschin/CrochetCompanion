import { useState } from 'react';
import { Lock, Unlock, Edit, Trash, Minus, Plus } from 'lucide-react';
import { PatternStep } from '../lib/types';

interface PatternStepCardProps {
  step: PatternStep;
  stepNumber: number;
  onUpdate: (updatedStep: PatternStep) => void;
  onDelete: () => void;
}

const PatternStepCard: React.FC<PatternStepCardProps> = ({
  step,
  stepNumber,
  onUpdate,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(step.text);

  const toggleLock = () => {
    onUpdate({ ...step, locked: !step.locked });
  };

  const toggleCompleted = () => {
    onUpdate({ ...step, completed: !step.completed });
  };

  const incrementCount = () => {
    onUpdate({ ...step, count: step.count + 1 });
  };

  const decrementCount = () => {
    if (step.count > 0) {
      onUpdate({ ...step, count: step.count - 1 });
    }
  };

  const updateNotes = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ ...step, notes: e.target.value });
  };

  const handleSaveEdit = () => {
    onUpdate({ ...step, text: editedText });
    setIsEditing(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <span className="flex items-center justify-center w-6 h-6 bg-primary-100 text-primary-800 rounded-full text-xs font-bold">
              {stepNumber}
            </span>
            <div className="ml-3 flex items-center">
              <button
                className={`${step.locked ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}
                onClick={toggleLock}
                aria-label={step.locked ? "Unlock step" : "Lock step"}
              >
                {step.locked ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <div className="flex space-x-1">
            <button
              className="text-gray-500 hover:text-primary p-1"
              onClick={() => setIsEditing(true)}
              aria-label="Edit step"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              className="text-gray-500 hover:text-primary p-1"
              onClick={onDelete}
              aria-label="Delete step"
            >
              <Trash className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isEditing ? (
          <div className="mb-4">
            <textarea
              className="w-full p-2 border border-gray-300 rounded-lg"
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end mt-2">
              <button
                className="text-sm bg-primary text-white px-3 py-1 rounded-md"
                onClick={handleSaveEdit}
              >
                Save
              </button>
              <button
                className="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded-md ml-2"
                onClick={() => {
                  setEditedText(step.text);
                  setIsEditing(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-secondary-700 mb-4">{step.text}</p>
        )}

        {step.aiStepImage && (
          <div className="flex mb-4">
            <div className="flex-1">
              <p className="text-secondary-700">{step.text}</p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <img
                src={step.aiStepImage}
                alt={`Crochet step ${stepNumber}`}
                className="h-16 w-16 rounded-md object-cover"
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center">
            <span className="text-xs text-secondary-500 mr-2">Count:</span>
            <div className="flex items-center">
              <button
                className="w-6 h-6 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-600 hover:bg-secondary-200"
                onClick={decrementCount}
                aria-label="Decrease count"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="mx-2 text-sm font-medium">{step.count}</span>
              <button
                className="w-6 h-6 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-600 hover:bg-secondary-200"
                onClick={incrementCount}
                aria-label="Increase count"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>

          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-primary shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              checked={step.completed}
              onChange={toggleCompleted}
            />
            <span className="ml-2 text-sm text-secondary-600">Mark as complete</span>
          </label>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center p-3 border-b border-gray-200">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-secondary-500 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
              />
            </svg>
            <span className="text-xs font-medium text-secondary-500">Notes</span>
          </div>
          <textarea
            rows={2}
            className="w-full p-3 border-0 focus:ring-0 text-sm resize-none"
            placeholder="Add your notes here..."
            value={step.notes}
            onChange={updateNotes}
          />
        </div>
      </div>
    </div>
  );
};

export default PatternStepCard;
