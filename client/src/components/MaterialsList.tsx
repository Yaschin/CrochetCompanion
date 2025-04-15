import React, { useState } from 'react';
import { Edit, Trash, Save, X, StickyNote, RefreshCw } from 'lucide-react';
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
    <div className="mb-4 bg-white rounded-lg border border-gray-200">
      <div className="flex justify-between items-center p-2 border-b border-gray-200">
        <h3 className="text-base font-medium text-secondary-700">Materials</h3>
        <div className="flex space-x-1">
          {isEditing ? (
            <>
              <button 
                onClick={handleSave}
                className="inline-flex items-center p-1 rounded text-green-600 hover:bg-green-50"
                title="Save changes"
              >
                <Save size={16} />
              </button>
              <button 
                onClick={handleCancel}
                className="inline-flex items-center p-1 rounded text-red-600 hover:bg-red-50"
                title="Cancel"
              >
                <X size={16} />
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setIsNotesOpen(!isNotesOpen)}
                className={`inline-flex items-center p-1 rounded ${isNotesOpen ? 'text-amber-500' : 'text-gray-500'} hover:bg-gray-50`}
                title="Material notes"
              >
                <StickyNote size={16} />
              </button>
              <button 
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center p-1 rounded text-gray-500 hover:bg-gray-50"
                title="Edit materials"
              >
                <Edit size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {isNotesOpen && (
        <div className={`p-2 bg-yellow-50 border-b border-yellow-100 text-xs`}>
          {isEditing ? (
            <textarea
              value={editedNotes}
              onChange={(e) => setEditedNotes(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
              rows={2}
              placeholder="Add any notes about materials here..."
            />
          ) : (
            <p className="text-xs text-gray-700">{materialsNotes || "No material notes added."}</p>
          )}
        </div>
      )}

      <div className="p-0">
        {(yarnRequirements.length === 0 && !isEditing) ? (
          <div className="text-gray-500 italic text-center py-2 text-xs">
            No materials specified
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {(isEditing ? editedRequirements : yarnRequirements).map((req, index) => (
              <div key={index} className="flex items-center justify-between py-1.5 px-2">
                <div className="flex items-center">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full mr-2" 
                    style={{ backgroundColor: getColorStyle(req.color) }} />
                  
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        value={req.color}
                        onChange={(e) => updateRequirement(index, 'color', e.target.value)}
                        className="border border-gray-300 rounded px-1.5 py-0.5 text-xs w-24 mr-1"
                        placeholder="Color"
                      />
                      <input
                        type="text"
                        value={req.volume}
                        onChange={(e) => updateRequirement(index, 'volume', e.target.value)}
                        className="border border-gray-300 rounded px-1.5 py-0.5 text-xs w-16"
                        placeholder="Amount"
                      />
                    </>
                  ) : (
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-800">{req.color}</span>
                      {req.volume && (
                        <span className="text-xs text-gray-500 ml-1.5 bg-gray-100 px-1.5 py-0.5 rounded-full">{req.volume}</span>
                      )}
                    </div>
                  )}
                </div>
                
                {isEditing && (
                  <button 
                    onClick={() => removeRequirement(index)}
                    className="text-red-400 hover:text-red-600 p-0.5"
                    title="Remove material"
                  >
                    <Trash size={14} />
                  </button>
                )}
              </div>
            ))}
            
            {isEditing && (
              <div className="py-1 px-2">
                <button 
                  onClick={addRequirement}
                  className="w-full text-center py-1 border border-dashed border-gray-300 rounded text-primary-600 hover:border-primary-500 text-xs"
                >
                  + Add Material
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MaterialsList;