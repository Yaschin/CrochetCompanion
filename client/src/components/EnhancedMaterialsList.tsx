import React, { useState, useEffect } from 'react';
import { Edit, CheckSquare, Square } from 'lucide-react';
import { YarnIcon } from '../icons/WoolIcons';
import {
  YarnRequirement,
  HookRequirement,
  NotionsRequirement,
  ToolRequirement,
} from '../lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import EditableItemList from './EditableItemList';

interface EnhancedMaterialsListProps {
  yarnRequirements?: YarnRequirement[];
  hookRequirements?: HookRequirement[];
  notionsRequirements?: NotionsRequirement[];
  toolRequirements?: ToolRequirement[];
  needsStuffing?: string;
  materialsNotes?: string;
  onUpdate: (updatedMaterials: {
    yarnRequirements: YarnRequirement[];
    hookRequirements: HookRequirement[];
    notionsRequirements: NotionsRequirement[];
    toolRequirements: ToolRequirement[];
    needsStuffing: string;
    materialsNotes: string;
  }) => void;
}

const inputClass = 'p-1 text-xs border border-gray-300 rounded';

const EnhancedMaterialsList: React.FC<EnhancedMaterialsListProps> = ({
  yarnRequirements = [],
  hookRequirements = [],
  notionsRequirements = [],
  toolRequirements = [],
  needsStuffing = '',
  materialsNotes = '',
  onUpdate,
}) => {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState(materialsNotes);
  const [stuffingValue, setStuffingValue] = useState(needsStuffing);
  const [activeTab, setActiveTab] = useState('yarn');

  useEffect(() => {
    setEditedNotes(materialsNotes);
    setStuffingValue(needsStuffing);
  }, [materialsNotes, needsStuffing]);

  // Merge a partial materials update with everything else, then bubble up.
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
      materialsNotes: updates.materialsNotes || materialsNotes,
    });
  };

  const toggleStuffing = () => {
    const next = stuffingValue ? '' : 'Polyester Fiberfill Stuffing';
    setStuffingValue(next);
    updateAllMaterials({ needsStuffing: next });
  };

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

        {/* Yarn */}
        <TabsContent value="yarn">
          <EditableItemList<YarnRequirement>
            items={yarnRequirements}
            onChange={(items) => updateAllMaterials({ yarnRequirements: items })}
            makeNew={() => ({ color: 'New Yarn', volume: '~100g' })}
            emptyLabel="No yarn added yet."
            addLabel="Add Yarn"
            itemNoun="material"
            renderLeading={(yarn) => (
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: yarn.color.toLowerCase() }} />
            )}
            renderDisplay={(yarn) => (
              <div className="flex-grow grid grid-cols-1 xs:grid-cols-2 gap-0.5 xs:gap-0">
                <span className="font-medium truncate">{yarn.color}</span>
                <span className="text-gray-600 truncate">{yarn.volume}</span>
              </div>
            )}
            renderEditor={(draft, update) => (
              <div className="flex-grow grid grid-cols-1 xs:grid-cols-2 gap-2">
                <input type="text" className={inputClass} value={draft.color} onChange={(e) => update({ color: e.target.value })} placeholder="Color/Name" />
                <input type="text" className={inputClass} value={draft.volume} onChange={(e) => update({ volume: e.target.value })} placeholder="Amount (e.g. 50g)" />
              </div>
            )}
          />
        </TabsContent>

        {/* Hooks */}
        <TabsContent value="hooks">
          <EditableItemList<HookRequirement>
            items={hookRequirements}
            onChange={(items) => updateAllMaterials({ hookRequirements: items })}
            makeNew={() => ({ size: '5.0mm', quantity: 1 })}
            emptyLabel="No hooks added yet."
            addLabel="Add Hook"
            itemNoun="hook"
            renderDisplay={(hook) => (
              <div className="flex-grow grid grid-cols-2 gap-0.5">
                <span className="font-medium">{hook.size}</span>
                <span className="text-gray-600">{hook.quantity} {hook.quantity > 1 ? 'hooks' : 'hook'}</span>
                {hook.note && <span className="text-gray-500 text-xs col-span-2 italic">{hook.note}</span>}
              </div>
            )}
            renderEditor={(draft, update) => (
              <div className="flex-grow grid grid-cols-2 gap-2">
                <input type="text" className={inputClass} value={draft.size} onChange={(e) => update({ size: e.target.value })} placeholder="Size (e.g. 5.0mm)" />
                <input type="number" className={inputClass} value={draft.quantity} onChange={(e) => update({ quantity: parseInt(e.target.value) || 1 })} placeholder="Quantity" />
                <input type="text" className={`${inputClass} col-span-2`} value={draft.note || ''} onChange={(e) => update({ note: e.target.value })} placeholder="Note (optional)" />
              </div>
            )}
          />
        </TabsContent>

        {/* Notions */}
        <TabsContent value="notions">
          <div className="flex items-center border-b border-gray-100 pb-2 mb-2 mt-2">
            <button onClick={toggleStuffing} className="flex items-center text-sm">
              {stuffingValue ? (
                <CheckSquare className="h-4 w-4 mr-2 text-primary-500" />
              ) : (
                <Square className="h-4 w-4 mr-2 text-gray-400" />
              )}
              <span>Stuffing (Polyester Fiberfill)</span>
            </button>
          </div>
          <EditableItemList<NotionsRequirement>
            items={notionsRequirements}
            onChange={(items) => updateAllMaterials({ notionsRequirements: items })}
            makeNew={() => ({ name: 'Safety Eyes', description: '12mm Black', quantity: 2 })}
            emptyLabel="No notions added yet."
            addLabel="Add Notions"
            itemNoun="notion"
            renderDisplay={(notion) => (
              <div className="flex-grow grid grid-cols-2 gap-0.5">
                <span className="font-medium">{notion.name}</span>
                <span className="text-gray-600">{notion.quantity} {notion.quantity > 1 ? 'pcs' : 'pc'}</span>
                <span className="text-gray-500 text-xs col-span-2">{notion.description}</span>
              </div>
            )}
            renderEditor={(draft, update) => (
              <div className="flex-grow grid grid-cols-2 gap-2">
                <input type="text" className={inputClass} value={draft.name} onChange={(e) => update({ name: e.target.value })} placeholder="Name (e.g. Safety Eyes)" />
                <input type="number" className={inputClass} value={draft.quantity} onChange={(e) => update({ quantity: parseInt(e.target.value) || 1 })} placeholder="Quantity" />
                <input type="text" className={`${inputClass} col-span-2`} value={draft.description} onChange={(e) => update({ description: e.target.value })} placeholder="Description" />
              </div>
            )}
          />
        </TabsContent>

        {/* Tools */}
        <TabsContent value="tools">
          <EditableItemList<ToolRequirement>
            items={toolRequirements}
            onChange={(items) => updateAllMaterials({ toolRequirements: items })}
            makeNew={() => ({ name: 'Tapestry Needle', description: 'For sewing pieces' })}
            emptyLabel="No tools added yet."
            addLabel="Add Tool"
            itemNoun="tool"
            renderDisplay={(tool) => (
              <div className="flex-grow grid grid-cols-2 gap-0.5">
                <span className="font-medium">{tool.name}</span>
                {tool.quantity && <span className="text-gray-600">{tool.quantity} {tool.quantity > 1 ? 'pcs' : 'pc'}</span>}
                {tool.description && <span className="text-gray-500 text-xs col-span-2">{tool.description}</span>}
              </div>
            )}
            renderEditor={(draft, update) => (
              <div className="flex-grow grid grid-cols-2 gap-2">
                <input type="text" className={inputClass} value={draft.name} onChange={(e) => update({ name: e.target.value })} placeholder="Name (e.g. Tapestry Needle)" />
                <input type="number" className={inputClass} value={draft.quantity || ''} onChange={(e) => update({ quantity: e.target.value ? parseInt(e.target.value) : undefined })} placeholder="Quantity (optional)" />
                <input type="text" className={`${inputClass} col-span-2`} value={draft.description || ''} onChange={(e) => update({ description: e.target.value })} placeholder="Description (optional)" />
              </div>
            )}
          />
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
              <button onClick={() => setIsEditingNotes(false)} className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800">Cancel</button>
              <button onClick={handleSaveNotes} className="px-2 py-1 text-xs bg-primary-100 text-primary-800 rounded hover:bg-primary-200">Save Notes</button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-md p-2 text-sm text-gray-600 relative min-h-[3rem]">
            {materialsNotes ? materialsNotes : <span className="text-gray-400 italic">No notes added.</span>}
            <button
              onClick={() => { setIsEditingNotes(true); setEditedNotes(materialsNotes); }}
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
