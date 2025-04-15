import React, { useState } from 'react';
import { Edit, Trash, Save, X, StickyNote } from 'lucide-react';
import { YarnRequirement } from '@shared/schema';

interface MaterialsListProps {
  yarnRequirements: YarnRequirement[];
  materialsNotes: string;
  onUpdate: (updatedRequirements: YarnRequirement[], updatedNotes: string) => void;
}

const MaterialsList: React.FC<MaterialsListProps> = ({ 
  yarnRequirements, 
  materialsNotes, 
  onUpdate 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedRequirements, setEditedRequirements] = useState<YarnRequirement[]>(yarnRequirements);
  const [editedNotes, setEditedNotes] = useState(materialsNotes);
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  const handleSave = () => {
    onUpdate(editedRequirements, editedNotes);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedRequirements(yarnRequirements);
    setEditedNotes(materialsNotes);
    setIsEditing(false);
  };

  const updateRequirement = (index: number, field: keyof YarnRequirement, value: string) => {
    const updated = [...editedRequirements];
    updated[index] = { ...updated[index], [field]: value };
    setEditedRequirements(updated);
  };

  const addRequirement = () => {
    setEditedRequirements([...editedRequirements, { color: 'New Color', volume: '0g' }]);
  };

  const removeRequirement = (index: number) => {
    setEditedRequirements(editedRequirements.filter((_, i) => i !== index));
  };

  // Get a simple color code to use as background for the yarn ball icon
  const getColorStyle = (colorName: string) => {
    const colorMap: Record<string, string> = {
      'red': '#ffcccc',
      'green': '#ccffcc',
      'blue': '#ccccff',
      'yellow': '#ffffcc',
      'orange': '#ffddcc',
      'purple': '#eeccff',
      'pink': '#ffccee',
      'black': '#cccccc',
      'white': '#ffffff',
      'gray': '#e0e0e0',
      'brown': '#e6ccb3',
    };

    // Check if color name contains any of our mapped colors
    const lowerColorName = colorName.toLowerCase();
    for (const [key, value] of Object.entries(colorMap)) {
      if (lowerColorName.includes(key)) {
        return value;
      }
    }
    
    // Default to a light purple if no match
    return '#f5f0ff';
  };

  return (
    <div className="mb-6 bg-white rounded-xl p-4 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-secondary-700">Materials</h3>
        <div>
          {isEditing ? (
            <div className="flex space-x-2">
              <button 
                onClick={handleSave}
                className="inline-flex items-center p-1.5 rounded-full text-green-600 hover:bg-green-50"
              >
                <Save size={18} />
              </button>
              <button 
                onClick={handleCancel}
                className="inline-flex items-center p-1.5 rounded-full text-red-600 hover:bg-red-50"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center p-1.5 rounded-full text-gray-600 hover:bg-gray-50"
            >
              <Edit size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {editedRequirements.length === 0 && (
          <div className="text-gray-500 italic text-center py-2">
            No materials specified
          </div>
        )}
        
        {isEditing ? (
          // Editable view
          <>
            {editedRequirements.map((req, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="flex-shrink-0 w-6 h-6 rounded-full" 
                  style={{ backgroundColor: getColorStyle(req.color) }}
                />
                <input
                  type="text"
                  value={req.color}
                  onChange={(e) => updateRequirement(index, 'color', e.target.value)}
                  className="flex-grow border border-gray-300 rounded-md px-2 py-1 text-sm"
                  placeholder="Color name"
                />
                <input
                  type="text"
                  value={req.volume}
                  onChange={(e) => updateRequirement(index, 'volume', e.target.value)}
                  className="w-20 border border-gray-300 rounded-md px-2 py-1 text-sm"
                  placeholder="Amount"
                />
                <button 
                  onClick={() => removeRequirement(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash size={16} />
                </button>
              </div>
            ))}
            
            <button 
              onClick={addRequirement}
              className="w-full text-center py-2 border border-dashed border-gray-300 rounded-md text-primary-600 hover:border-primary-500 text-sm"
            >
              + Add Material
            </button>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Materials Notes</label>
              <textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                rows={3}
                placeholder="Add any notes about materials here..."
              />
            </div>
          </>
        ) : (
          // Display view
          <>
            {yarnRequirements.map((req, index) => (
              <div key={index} className="flex items-center px-3 py-2 bg-gray-50 rounded-lg">
                <div 
                  className="flex-shrink-0 w-6 h-6 rounded-full mr-3" 
                  style={{ backgroundColor: getColorStyle(req.color) }}
                />
                <span className="flex-grow font-medium">{req.color} Yarn</span>
                <span className="text-gray-600">{req.volume}</span>
              </div>
            ))}

            {/* Materials Notes */}
            {materialsNotes && (
              <div className="mt-3">
                <button 
                  onClick={() => setIsNotesOpen(!isNotesOpen)} 
                  className="flex items-center text-sm text-gray-600 hover:text-primary-700"
                >
                  <StickyNote size={16} className="mr-1" />
                  {isNotesOpen ? 'Hide' : 'Show'} Materials Notes
                </button>
                
                {isNotesOpen && (
                  <div className="mt-2 p-3 bg-yellow-50 rounded-md text-sm">
                    {materialsNotes}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MaterialsList;