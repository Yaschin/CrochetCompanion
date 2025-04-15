import React, { useState, useEffect } from 'react';
import { SizeIcon } from '../icons/WoolIcons';

interface SizeSliderProps {
  value: string;
  onChange: (size: string) => void;
}

const SizeSlider: React.FC<SizeSliderProps> = ({ value, onChange }) => {
  // Extract numerical value from the string for the slider
  const extractSize = (sizeString: string): number => {
    const match = sizeString.match(/(\d+)/);
    return match ? parseInt(match[0], 10) : 10; // Default to 10 if no number is found
  };

  const [sliderValue, setSliderValue] = useState(extractSize(value || '10 cm'));
  const [unit, setUnit] = useState((value || '').includes('inch') ? 'inch' : 'cm');

  // Update the slider when the external value changes
  useEffect(() => {
    setSliderValue(extractSize(value));
  }, [value]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    setSliderValue(newValue);
    onChange(`${newValue} ${unit}`);
  };

  const handleUnitChange = (newUnit: string) => {
    setUnit(newUnit);
    onChange(`${sliderValue} ${newUnit}`);
  };

  return (
    <div className="space-y-2">
      <label className="flex items-center text-sm font-medium text-secondary-600">
        <SizeIcon className="wool-icon h-5 w-5 mr-1 text-primary-400" />
        Project Size: <span className="ml-1 font-bold text-primary">{sliderValue} {unit}</span>
      </label>
      
      <div className="flex items-center space-x-2">
        <span className="text-xs text-gray-500">10</span>
        <input
          type="range"
          min={10}
          max={100}
          value={sliderValue}
          onChange={handleSliderChange}
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
        />
        <span className="text-xs text-gray-500">100</span>
      </div>
      
      <div className="flex space-x-2 justify-end">
        <button
          type="button"
          className={`px-2 py-1 text-xs rounded-full ${
            unit === 'cm' 
              ? 'bg-primary-100 text-primary-800 font-medium' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => handleUnitChange('cm')}
        >
          cm
        </button>
        <button
          type="button"
          className={`px-2 py-1 text-xs rounded-full ${
            unit === 'inch' 
              ? 'bg-primary-100 text-primary-800 font-medium' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => handleUnitChange('inch')}
        >
          inch
        </button>
      </div>
    </div>
  );
};

export default SizeSlider;