import React, { useState } from 'react';
import { Edit, Trash, Plus, Save, X } from 'lucide-react';
import { YarnIcon } from '../icons/WoolIcons';
import { YarnRequirement } from '@/lib/types';

interface MaterialsListProps {
  materials: YarnRequirement[];
  notes: string;
  onUpdate: (updatedMaterials: YarnRequirement[], updatedNotes: string) => void;
}

const MaterialsList: React.FC<MaterialsListProps> = ({ materials, notes, onUpdate }) => {
  const [editingMaterialIndex, setEditingMaterialIndex] = useState<number | null>(null);
  const [editedMaterial, setEditedMaterial] = useState<YarnRequirement | null>(null);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState(notes);

  const handleEditMaterial = (index: number) => {
    setEditingMaterialIndex(index);
    setEditedMaterial({ ...materials[index] });
  };

  const handleSaveMaterial = () => {
    if (editingMaterialIndex !== null && editedMaterial) {
      const updatedMaterials = [...materials];
      updatedMaterials[editingMaterialIndex] = editedMaterial;
      onUpdate(updatedMaterials, notes);
      setEditingMaterialIndex(null);
      setEditedMaterial(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingMaterialIndex(null);
    setEditedMaterial(null);
  };

  const handleDeleteMaterial = (index: number) => {
    const updatedMaterials = materials.filter((_, i) => i !== index);
    onUpdate(updatedMaterials, notes);
  };

  const handleAddMaterial = () => {
    const newMaterial: YarnRequirement = { color: 'New Yarn', volume: '~100g' };
    onUpdate([...materials, newMaterial], notes);
    // Start editing the new material
    setEditingMaterialIndex(materials.length);
    setEditedMaterial(newMaterial);
  };

  const handleSaveNotes = () => {
    onUpdate(materials, editedNotes);
    setIsEditingNotes(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <h3 className="text-sm font-medium text-secondary-700 mb-3 flex items-center">
        <YarnIcon className="wool-icon h-5 w-5 mr-1 text-primary-400" />
        Materials
      </h3>
      
      {/* Material Rows */}
      <div className="space-y-2 mb-4">
        {materials.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No materials added yet.</p>
        ) : (
          materials.map((material, index) => (
            <div key={index} className="flex items-center text-sm border-b border-gray-100 pb-2">
              {editingMaterialIndex === index && editedMaterial ? (
                // Edit mode
                <>
                  <div className="flex-grow grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      className="p-1 text-xs border border-gray-300 rounded"
                      value={editedMaterial.color}
                      onChange={(e) => setEditedMaterial({ ...editedMaterial, color: e.target.value })}
                      placeholder="Color/Name"
                    />
                    <input
                      type="text"
                      className="p-1 text-xs border border-gray-300 rounded"
                      value={editedMaterial.volume}
                      onChange={(e) => setEditedMaterial({ ...editedMaterial, volume: e.target.value })}
                      placeholder="Amount (e.g. 50g)"
                    />
                  </div>
                  <div className="flex space-x-1 ml-2">
                    <button
                      onClick={handleSaveMaterial}
                      className="p-1 text-green-500 hover:text-green-700"
                      title="Save changes"
                    >
                      <Save size={16} />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1 text-red-500 hover:text-red-700"
                      title="Cancel"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </>
              ) : (
                // Display mode
                <>
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: material.color.toLowerCase() }}></div>
                  <div className="flex-grow grid grid-cols-2">
                    <span className="font-medium">{material.color}</span>
                    <span className="text-gray-600">{material.volume}</span>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEditMaterial(index)}
                      className="p-1 text-gray-400 hover:text-gray-700"
                      title="Edit material"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteMaterial(index)}
                      className="p-1 text-gray-400 hover:text-red-500"
                      title="Delete material"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Add Material Button */}
      <button
        onClick={handleAddMaterial}
        className="w-full flex items-center justify-center py-1 border border-dashed border-gray-300 rounded-md text-secondary-500 hover:text-secondary-700 hover:border-secondary-400 text-xs mb-4"
      >
        <Plus className="h-3.5 w-3.5 mr-1" />
        <span>Add Material</span>
      </button>
      
      {/* Materials Notes */}
      <div className="mt-2">
        <h4 className="text-xs font-medium text-secondary-700 mb-1">Notes</h4>
        
        {isEditingNotes ? (
          <div className="space-y-2">
            <textarea
              value={editedNotes}
              onChange={(e) => setEditedNotes(e.target.value)}
              className="w-full p-2 text-sm border border-gray-300 rounded-md"
              rows={3}
              placeholder="Add notes about the materials..."
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsEditingNotes(false)}
                className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                className="px-2 py-1 text-xs bg-primary-100 text-primary-800 rounded hover:bg-primary-200"
              >
                Save Notes
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-md p-2 text-sm text-gray-600 relative min-h-[3rem]">
            {notes ? (
              notes
            ) : (
              <span className="text-gray-400 italic">No notes added.</span>
            )}
            <button
              onClick={() => {
                setIsEditingNotes(true);
                setEditedNotes(notes);
              }}
              className="absolute top-1 right-1 p-1 text-gray-400 hover:text-gray-700"
              title="Edit notes"
            >
              <Edit size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaterialsList;