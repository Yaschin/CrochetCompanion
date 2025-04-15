import React, { useState, useEffect } from 'react';
import { Edit, Trash, Plus, Save, X, CheckSquare, Square } from 'lucide-react';
import { YarnIcon } from '../icons/WoolIcons';
import { 
  YarnRequirement, 
  HookRequirement, 
  NotionsRequirement, 
  ToolRequirement 
} from '../lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface EnhancedMaterialsListProps {
  // Yarn requirements
  yarnRequirements?: YarnRequirement[];
  
  // New material types
  hookRequirements?: HookRequirement[];
  notionsRequirements?: NotionsRequirement[];
  toolRequirements?: ToolRequirement[];
  needsStuffing?: string;
  
  // Notes
  materialsNotes?: string;
  
  // Update handler
  onUpdate: (updatedMaterials: {
    yarnRequirements: YarnRequirement[];
    hookRequirements: HookRequirement[];
    notionsRequirements: NotionsRequirement[];
    toolRequirements: ToolRequirement[];
    needsStuffing: string;
    materialsNotes: string;
  }) => void;
}

const EnhancedMaterialsList: React.FC<EnhancedMaterialsListProps> = ({ 
  yarnRequirements = [], 
  hookRequirements = [],
  notionsRequirements = [],
  toolRequirements = [],
  needsStuffing = "",
  materialsNotes = "",
  onUpdate 
}) => {
  // State for each material type
  const [editingYarnIndex, setEditingYarnIndex] = useState<number | null>(null);
  const [editedYarn, setEditedYarn] = useState<YarnRequirement | null>(null);
  
  const [editingHookIndex, setEditingHookIndex] = useState<number | null>(null);
  const [editedHook, setEditedHook] = useState<HookRequirement | null>(null);
  
  const [editingNotionIndex, setEditingNotionIndex] = useState<number | null>(null);
  const [editedNotion, setEditedNotion] = useState<NotionsRequirement | null>(null);
  
  const [editingToolIndex, setEditingToolIndex] = useState<number | null>(null);
  const [editedTool, setEditedTool] = useState<ToolRequirement | null>(null);
  
  // Notes editing state
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState(materialsNotes);
  
  // Stuffing state
  const [stuffingValue, setStuffingValue] = useState(needsStuffing);
  
  // Active tab state
  const [activeTab, setActiveTab] = useState("yarn");

  // Update state when props change
  useEffect(() => {
    setEditedNotes(materialsNotes);
    setStuffingValue(needsStuffing);
  }, [materialsNotes, needsStuffing]);

  // Helper function for triggering update
  const updateAllMaterials = (updates: Partial<{
    yarnRequirements: YarnRequirement[];
    hookRequirements: HookRequirement[];
    notionsRequirements: NotionsRequirement[];
    toolRequirements: ToolRequirement[];
    needsStuffing: string;
    materialsNotes: string;
  }>) => {
    onUpdate({
      yarnRequirements: updates.yarnRequirements || yarnRequirements,
      hookRequirements: updates.hookRequirements || hookRequirements,
      notionsRequirements: updates.notionsRequirements || notionsRequirements,
      toolRequirements: updates.toolRequirements || toolRequirements,
      needsStuffing: updates.needsStuffing !== undefined ? updates.needsStuffing : stuffingValue,
      materialsNotes: updates.materialsNotes || materialsNotes
    });
  };

  // Yarn handlers
  const handleEditYarn = (index: number) => {
    setEditingYarnIndex(index);
    setEditedYarn({ ...yarnRequirements[index] });
  };

  const handleSaveYarn = () => {
    if (editingYarnIndex !== null && editedYarn) {
      const updatedYarn = [...yarnRequirements];
      updatedYarn[editingYarnIndex] = editedYarn;
      updateAllMaterials({ yarnRequirements: updatedYarn });
      setEditingYarnIndex(null);
      setEditedYarn(null);
    }
  };

  const handleDeleteYarn = (index: number) => {
    const updatedYarn = yarnRequirements.filter((_, i) => i !== index);
    updateAllMaterials({ yarnRequirements: updatedYarn });
  };

  const handleAddYarn = () => {
    const newYarn: YarnRequirement = { color: 'New Yarn', volume: '~100g' };
    updateAllMaterials({ yarnRequirements: [...yarnRequirements, newYarn] });
    // Start editing the new material
    setEditingYarnIndex(yarnRequirements.length);
    setEditedYarn(newYarn);
  };

  // Hook handlers
  const handleEditHook = (index: number) => {
    setEditingHookIndex(index);
    setEditedHook({ ...hookRequirements[index] });
  };

  const handleSaveHook = () => {
    if (editingHookIndex !== null && editedHook) {
      const updatedHooks = [...hookRequirements];
      updatedHooks[editingHookIndex] = editedHook;
      updateAllMaterials({ hookRequirements: updatedHooks });
      setEditingHookIndex(null);
      setEditedHook(null);
    }
  };

  const handleDeleteHook = (index: number) => {
    const updatedHooks = hookRequirements.filter((_, i) => i !== index);
    updateAllMaterials({ hookRequirements: updatedHooks });
  };

  const handleAddHook = () => {
    const newHook: HookRequirement = { size: '5.0mm', quantity: 1 };
    updateAllMaterials({ hookRequirements: [...hookRequirements, newHook] });
    // Start editing the new material
    setEditingHookIndex(hookRequirements.length);
    setEditedHook(newHook);
  };

  // Notions handlers
  const handleEditNotion = (index: number) => {
    setEditingNotionIndex(index);
    setEditedNotion({ ...notionsRequirements[index] });
  };

  const handleSaveNotion = () => {
    if (editingNotionIndex !== null && editedNotion) {
      const updatedNotions = [...notionsRequirements];
      updatedNotions[editingNotionIndex] = editedNotion;
      updateAllMaterials({ notionsRequirements: updatedNotions });
      setEditingNotionIndex(null);
      setEditedNotion(null);
    }
  };

  const handleDeleteNotion = (index: number) => {
    const updatedNotions = notionsRequirements.filter((_, i) => i !== index);
    updateAllMaterials({ notionsRequirements: updatedNotions });
  };

  const handleAddNotion = () => {
    const newNotion: NotionsRequirement = { name: 'Safety Eyes', description: '12mm Black', quantity: 2 };
    updateAllMaterials({ notionsRequirements: [...notionsRequirements, newNotion] });
    // Start editing the new material
    setEditingNotionIndex(notionsRequirements.length);
    setEditedNotion(newNotion);
  };

  // Tool handlers
  const handleEditTool = (index: number) => {
    setEditingToolIndex(index);
    setEditedTool({ ...toolRequirements[index] });
  };

  const handleSaveTool = () => {
    if (editingToolIndex !== null && editedTool) {
      const updatedTools = [...toolRequirements];
      updatedTools[editingToolIndex] = editedTool;
      updateAllMaterials({ toolRequirements: updatedTools });
      setEditingToolIndex(null);
      setEditedTool(null);
    }
  };

  const handleDeleteTool = (index: number) => {
    const updatedTools = toolRequirements.filter((_, i) => i !== index);
    updateAllMaterials({ toolRequirements: updatedTools });
  };

  const handleAddTool = () => {
    const newTool: ToolRequirement = { name: 'Tapestry Needle', description: 'For sewing pieces' };
    updateAllMaterials({ toolRequirements: [...toolRequirements, newTool] });
    // Start editing the new material
    setEditingToolIndex(toolRequirements.length);
    setEditedTool(newTool);
  };

  // Stuffing handlers
  const toggleStuffing = () => {
    if (stuffingValue) {
      setStuffingValue("");
      updateAllMaterials({ needsStuffing: "" });
    } else {
      setStuffingValue("Polyester Fiberfill Stuffing");
      updateAllMaterials({ needsStuffing: "Polyester Fiberfill Stuffing" });
    }
  };

  // Notes handlers
  const handleSaveNotes = () => {
    updateAllMaterials({ materialsNotes: editedNotes });
    setIsEditingNotes(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
      <h3 className="text-sm font-medium text-secondary-700 mb-3 flex items-center">
        <YarnIcon className="wool-icon h-5 w-5 mr-1 text-primary-400" />
        Materials
      </h3>
      
      <Tabs defaultValue="yarn" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="yarn" className="flex-1">Yarn</TabsTrigger>
          <TabsTrigger value="hooks" className="flex-1">Hooks</TabsTrigger>
          <TabsTrigger value="notions" className="flex-1">Notions</TabsTrigger>
          <TabsTrigger value="tools" className="flex-1">Tools</TabsTrigger>
        </TabsList>
        
        {/* Yarn Tab */}
        <TabsContent value="yarn" className="space-y-2 mt-2">
          {yarnRequirements.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No yarn added yet.</p>
          ) : (
            yarnRequirements.map((yarn, index) => (
              <div key={index} className="flex items-center text-sm border-b border-gray-100 pb-2">
                {editingYarnIndex === index && editedYarn ? (
                  // Edit mode
                  <>
                    <div className="flex-grow grid grid-cols-1 xs:grid-cols-2 gap-2">
                      <input
                        type="text"
                        className="p-1 text-xs border border-gray-300 rounded"
                        value={editedYarn.color}
                        onChange={(e) => setEditedYarn({ ...editedYarn, color: e.target.value })}
                        placeholder="Color/Name"
                      />
                      <input
                        type="text"
                        className="p-1 text-xs border border-gray-300 rounded"
                        value={editedYarn.volume}
                        onChange={(e) => setEditedYarn({ ...editedYarn, volume: e.target.value })}
                        placeholder="Amount (e.g. 50g)"
                      />
                    </div>
                    <div className="flex space-x-1 ml-2">
                      <button
                        onClick={handleSaveYarn}
                        className="p-1 text-green-500 hover:text-green-700"
                        title="Save changes"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingYarnIndex(null);
                          setEditedYarn(null);
                        }}
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
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: yarn.color.toLowerCase() }}></div>
                    <div className="flex-grow grid grid-cols-1 xs:grid-cols-2 gap-0.5 xs:gap-0">
                      <span className="font-medium truncate">{yarn.color}</span>
                      <span className="text-gray-600 truncate">{yarn.volume}</span>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEditYarn(index)}
                        className="p-1 text-gray-400 hover:text-gray-700"
                        title="Edit material"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteYarn(index)}
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
          <button
            onClick={handleAddYarn}
            className="w-full flex items-center justify-center py-1 border border-dashed border-gray-300 rounded-md text-secondary-500 hover:text-secondary-700 hover:border-secondary-400 text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            <span>Add Yarn</span>
          </button>
        </TabsContent>
        
        {/* Hooks Tab */}
        <TabsContent value="hooks" className="space-y-2 mt-2">
          {hookRequirements.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No hooks added yet.</p>
          ) : (
            hookRequirements.map((hook, index) => (
              <div key={index} className="flex items-center text-sm border-b border-gray-100 pb-2">
                {editingHookIndex === index && editedHook ? (
                  // Edit mode
                  <>
                    <div className="flex-grow grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        className="p-1 text-xs border border-gray-300 rounded"
                        value={editedHook.size}
                        onChange={(e) => setEditedHook({ ...editedHook, size: e.target.value })}
                        placeholder="Size (e.g. 5.0mm)"
                      />
                      <input
                        type="number"
                        className="p-1 text-xs border border-gray-300 rounded"
                        value={editedHook.quantity}
                        onChange={(e) => setEditedHook({ ...editedHook, quantity: parseInt(e.target.value) || 1 })}
                        placeholder="Quantity"
                      />
                      <input
                        type="text"
                        className="p-1 text-xs border border-gray-300 rounded col-span-2"
                        value={editedHook.note || ""}
                        onChange={(e) => setEditedHook({ ...editedHook, note: e.target.value })}
                        placeholder="Note (optional)"
                      />
                    </div>
                    <div className="flex space-x-1 ml-2">
                      <button
                        onClick={handleSaveHook}
                        className="p-1 text-green-500 hover:text-green-700"
                        title="Save changes"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingHookIndex(null);
                          setEditedHook(null);
                        }}
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
                    <div className="flex-grow grid grid-cols-2 gap-0.5">
                      <span className="font-medium">{hook.size}</span>
                      <span className="text-gray-600">{hook.quantity} {hook.quantity > 1 ? 'hooks' : 'hook'}</span>
                      {hook.note && (
                        <span className="text-gray-500 text-xs col-span-2 italic">{hook.note}</span>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEditHook(index)}
                        className="p-1 text-gray-400 hover:text-gray-700"
                        title="Edit hook"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteHook(index)}
                        className="p-1 text-gray-400 hover:text-red-500"
                        title="Delete hook"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
          <button
            onClick={handleAddHook}
            className="w-full flex items-center justify-center py-1 border border-dashed border-gray-300 rounded-md text-secondary-500 hover:text-secondary-700 hover:border-secondary-400 text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            <span>Add Hook</span>
          </button>
        </TabsContent>
        
        {/* Notions Tab */}
        <TabsContent value="notions" className="space-y-2 mt-2">
          <div className="flex items-center border-b border-gray-100 pb-2 mb-2">
            <button
              onClick={toggleStuffing}
              className="flex items-center text-sm"
            >
              {stuffingValue ? (
                <CheckSquare className="h-4 w-4 mr-2 text-primary-500" />
              ) : (
                <Square className="h-4 w-4 mr-2 text-gray-400" />
              )}
              <span>Stuffing (Polyester Fiberfill)</span>
            </button>
          </div>
          
          {notionsRequirements.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No notions added yet.</p>
          ) : (
            notionsRequirements.map((notion, index) => (
              <div key={index} className="flex items-center text-sm border-b border-gray-100 pb-2">
                {editingNotionIndex === index && editedNotion ? (
                  // Edit mode
                  <>
                    <div className="flex-grow grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        className="p-1 text-xs border border-gray-300 rounded"
                        value={editedNotion.name}
                        onChange={(e) => setEditedNotion({ ...editedNotion, name: e.target.value })}
                        placeholder="Name (e.g. Safety Eyes)"
                      />
                      <input
                        type="number"
                        className="p-1 text-xs border border-gray-300 rounded"
                        value={editedNotion.quantity}
                        onChange={(e) => setEditedNotion({ ...editedNotion, quantity: parseInt(e.target.value) || 1 })}
                        placeholder="Quantity"
                      />
                      <input
                        type="text"
                        className="p-1 text-xs border border-gray-300 rounded col-span-2"
                        value={editedNotion.description}
                        onChange={(e) => setEditedNotion({ ...editedNotion, description: e.target.value })}
                        placeholder="Description"
                      />
                    </div>
                    <div className="flex space-x-1 ml-2">
                      <button
                        onClick={handleSaveNotion}
                        className="p-1 text-green-500 hover:text-green-700"
                        title="Save changes"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingNotionIndex(null);
                          setEditedNotion(null);
                        }}
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
                    <div className="flex-grow grid grid-cols-2 gap-0.5">
                      <span className="font-medium">{notion.name}</span>
                      <span className="text-gray-600">{notion.quantity} {notion.quantity > 1 ? 'pcs' : 'pc'}</span>
                      <span className="text-gray-500 text-xs col-span-2">{notion.description}</span>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEditNotion(index)}
                        className="p-1 text-gray-400 hover:text-gray-700"
                        title="Edit notion"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteNotion(index)}
                        className="p-1 text-gray-400 hover:text-red-500"
                        title="Delete notion"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
          <button
            onClick={handleAddNotion}
            className="w-full flex items-center justify-center py-1 border border-dashed border-gray-300 rounded-md text-secondary-500 hover:text-secondary-700 hover:border-secondary-400 text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            <span>Add Notions</span>
          </button>
        </TabsContent>
        
        {/* Tools Tab */}
        <TabsContent value="tools" className="space-y-2 mt-2">
          {toolRequirements.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No tools added yet.</p>
          ) : (
            toolRequirements.map((tool, index) => (
              <div key={index} className="flex items-center text-sm border-b border-gray-100 pb-2">
                {editingToolIndex === index && editedTool ? (
                  // Edit mode
                  <>
                    <div className="flex-grow grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        className="p-1 text-xs border border-gray-300 rounded"
                        value={editedTool.name}
                        onChange={(e) => setEditedTool({ ...editedTool, name: e.target.value })}
                        placeholder="Name (e.g. Tapestry Needle)"
                      />
                      <input
                        type="number"
                        className="p-1 text-xs border border-gray-300 rounded"
                        value={editedTool.quantity || ""}
                        onChange={(e) => setEditedTool({ 
                          ...editedTool, 
                          quantity: e.target.value ? parseInt(e.target.value) : undefined 
                        })}
                        placeholder="Quantity (optional)"
                      />
                      <input
                        type="text"
                        className="p-1 text-xs border border-gray-300 rounded col-span-2"
                        value={editedTool.description || ""}
                        onChange={(e) => setEditedTool({ ...editedTool, description: e.target.value })}
                        placeholder="Description (optional)"
                      />
                    </div>
                    <div className="flex space-x-1 ml-2">
                      <button
                        onClick={handleSaveTool}
                        className="p-1 text-green-500 hover:text-green-700"
                        title="Save changes"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingToolIndex(null);
                          setEditedTool(null);
                        }}
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
                    <div className="flex-grow grid grid-cols-2 gap-0.5">
                      <span className="font-medium">{tool.name}</span>
                      {tool.quantity && (
                        <span className="text-gray-600">{tool.quantity} {tool.quantity > 1 ? 'pcs' : 'pc'}</span>
                      )}
                      {tool.description && (
                        <span className="text-gray-500 text-xs col-span-2">{tool.description}</span>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEditTool(index)}
                        className="p-1 text-gray-400 hover:text-gray-700"
                        title="Edit tool"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteTool(index)}
                        className="p-1 text-gray-400 hover:text-red-500"
                        title="Delete tool"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
          <button
            onClick={handleAddTool}
            className="w-full flex items-center justify-center py-1 border border-dashed border-gray-300 rounded-md text-secondary-500 hover:text-secondary-700 hover:border-secondary-400 text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            <span>Add Tool</span>
          </button>
        </TabsContent>
      </Tabs>
      
      {/* Materials Notes */}
      <div className="mt-4">
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
            {materialsNotes ? (
              materialsNotes
            ) : (
              <span className="text-gray-400 italic">No notes added.</span>
            )}
            <button
              onClick={() => {
                setIsEditingNotes(true);
                setEditedNotes(materialsNotes);
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

export default EnhancedMaterialsList;