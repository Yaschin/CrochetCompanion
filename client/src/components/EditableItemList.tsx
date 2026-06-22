import { ReactNode, useState } from 'react';
import { Edit, Trash, Plus, Save, X } from 'lucide-react';

interface EditableItemListProps<T> {
  items: T[];
  onChange: (items: T[]) => void;
  /** Factory for a new item when "Add" is pressed (it opens straight into edit). */
  makeNew: () => T;
  /** Optional element shown before the display content (e.g. a yarn colour swatch). */
  renderLeading?: (item: T) => ReactNode;
  /** Display content for a row — return your own `flex-grow` wrapper. */
  renderDisplay: (item: T) => ReactNode;
  /** Editor content for a row — return your own `flex-grow` wrapper. */
  renderEditor: (draft: T, update: (patch: Partial<T>) => void) => ReactNode;
  emptyLabel: string;
  addLabel: string;
  /** Noun used in the edit/delete button titles, e.g. "hook". */
  itemNoun: string;
}

/**
 * A small inline-editable list: rows toggle between display and edit, with
 * add/save/cancel/delete handled here. Callers supply the per-row display and
 * editor markup, so one component serves yarn / hooks / notions / tools.
 */
export default function EditableItemList<T>({
  items, onChange, makeNew, renderLeading, renderDisplay, renderEditor, emptyLabel, addLabel, itemNoun,
}: EditableItemListProps<T>) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<T | null>(null);

  const cancel = () => { setEditingIndex(null); setDraft(null); };
  const startEdit = (i: number) => { setEditingIndex(i); setDraft({ ...items[i] }); };
  const save = () => {
    if (editingIndex === null || draft === null) return;
    const next = [...items];
    next[editingIndex] = draft;
    onChange(next);
    cancel();
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => {
    const item = makeNew();
    onChange([...items, item]);
    setEditingIndex(items.length); // the freshly-appended row
    setDraft(item);
  };
  const update = (patch: Partial<T>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  return (
    <div className="space-y-2 mt-2">
      {items.length === 0 ? (
        <p className="text-sm text-gray-500 italic">{emptyLabel}</p>
      ) : (
        items.map((item, index) => (
          <div key={index} className="flex items-center text-sm border-b border-gray-100 pb-2">
            {editingIndex === index && draft !== null ? (
              <>
                {renderEditor(draft, update)}
                <div className="flex space-x-1 ml-2">
                  <button onClick={save} className="p-1 text-green-500 hover:text-green-700" title="Save changes"><Save size={16} /></button>
                  <button onClick={cancel} className="p-1 text-red-500 hover:text-red-700" title="Cancel"><X size={16} /></button>
                </div>
              </>
            ) : (
              <>
                {renderLeading?.(item)}
                {renderDisplay(item)}
                <div className="flex space-x-1">
                  <button onClick={() => startEdit(index)} className="p-1 text-gray-400 hover:text-gray-700" title={`Edit ${itemNoun}`}><Edit size={16} /></button>
                  <button onClick={() => remove(index)} className="p-1 text-gray-400 hover:text-red-500" title={`Delete ${itemNoun}`}><Trash size={16} /></button>
                </div>
              </>
            )}
          </div>
        ))
      )}
      <button
        onClick={add}
        className="w-full flex items-center justify-center py-1 border border-dashed border-gray-300 rounded-md text-secondary-500 hover:text-secondary-700 hover:border-secondary-400 text-xs"
      >
        <Plus className="h-3.5 w-3.5 mr-1" />
        <span>{addLabel}</span>
      </button>
    </div>
  );
}
