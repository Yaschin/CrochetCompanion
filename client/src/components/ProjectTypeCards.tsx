import React, { useState } from 'react';
import { Rabbit, Shirt, Home, ShoppingBag, PenLine } from 'lucide-react';

interface ProjectType {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
}

interface ProjectTypeCardsProps {
  selectedType: string;
  onSelect: (type: string, customValue?: string) => void;
}

const PROJECT_TYPES: ProjectType[] = [
  {
    id: 'plushie',
    label: 'Plushie',
    icon: <Rabbit className="h-8 w-8 text-primary-500" />,
    description: 'Soft and cuddly plush toys'
  },
  {
    id: 'accessory',
    label: 'Accessory',
    icon: <Shirt className="h-8 w-8 text-primary-500" />,
    description: 'Hats, scarves, and wearable items'
  },
  {
    id: 'homeDecor',
    label: 'Home Decor',
    icon: <Home className="h-8 w-8 text-primary-500" />,
    description: 'Pillows, blankets, and decorative items'
  },
  {
    id: 'bag',
    label: 'Bag/Purse',
    icon: <ShoppingBag className="h-8 w-8 text-primary-500" />,
    description: 'Bags, totes, and carrying accessories'
  },
  {
    id: 'custom',
    label: 'Custom',
    icon: <PenLine className="h-8 w-8 text-primary-500" />,
    description: 'Create your own project type'
  }
];

const ProjectTypeCards: React.FC<ProjectTypeCardsProps> = ({ selectedType, onSelect }) => {
  const [customValue, setCustomValue] = useState('');
  
  const handleTypeClick = (typeId: string) => {
    if (typeId === 'custom') {
      onSelect(typeId, customValue);
    } else {
      onSelect(typeId);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {PROJECT_TYPES.map((type) => (
        <div
          key={type.id}
          className={`relative border rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
            selectedType === type.id 
              ? 'border-primary-500 bg-primary-50 shadow-md' 
              : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
          }`}
          onClick={() => handleTypeClick(type.id)}
        >
          <div className="flex items-center justify-center h-12 w-12 mb-2">
            {type.icon}
          </div>
          
          <h3 className="text-sm font-medium text-secondary-700 text-center">
            {type.label}
          </h3>
          
          {type.description && (
            <p className="mt-1 text-xs text-gray-500 text-center hidden md:block">
              {type.description}
            </p>
          )}

          {/* Custom input field */}
          {type.id === 'custom' && (
            <div className={`mt-2 w-full ${selectedType === 'custom' ? 'block' : 'hidden md:block'}`}>
              <input
                type="text"
                className="w-full p-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
                placeholder="Type project name..."
                value={customValue}
                onChange={(e) => {
                  setCustomValue(e.target.value);
                  if (selectedType === 'custom') {
                    onSelect('custom', e.target.value);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ProjectTypeCards;