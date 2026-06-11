import { FC, useEffect, useMemo, useState } from 'react';
import { useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { StashItem, StashItemType } from '../lib/types';
import { cn } from '../lib/utils';
import { WoolBallIcon } from '../icons/WoolIcons';
import { Plus, Pencil, Trash2, Search, Package } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

const TYPES: { key: StashItemType; label: string; plural: string }[] = [
  { key: 'yarn', label: 'Yarn', plural: 'Yarn' },
  { key: 'hook', label: 'Hook', plural: 'Hooks' },
  { key: 'notion', label: 'Notion', plural: 'Notions' },
  { key: 'tool', label: 'Tool', plural: 'Tools' },
];

type FormState = {
  type: StashItemType;
  name: string;
  color: string;
  volume: string;
  size: string;
  description: string;
  quantity: number;
  notes: string;
};

const emptyForm = (type: StashItemType = 'yarn'): FormState => ({
  type, name: '', color: '', volume: '', size: '', description: '', quantity: 1, notes: '',
});

// Build a clean API payload, dropping irrelevant/empty fields per type.
const buildPayload = (f: FormState): Omit<StashItem, 'id'> => {
  const base = {
    type: f.type,
    name: f.name.trim(),
    quantity: f.quantity > 0 ? f.quantity : 1,
    notes: f.notes.trim() || undefined,
  };
  if (f.type === 'yarn') return { ...base, color: f.color.trim() || undefined, volume: f.volume.trim() || undefined };
  if (f.type === 'hook') return { ...base, size: f.size.trim() || undefined };
  return { ...base, description: f.description.trim() || undefined };
};

// One-line summary of an item's distinguishing details.
const itemDetail = (item: StashItem): string => {
  if (item.type === 'yarn') return [item.color, item.volume].filter(Boolean).join(' · ');
  if (item.type === 'hook') return item.size || '';
  return item.description || '';
};

const MaterialsInventory: FC = () => {
  const { toast } = useToast();
  const [filter, setFilter] = useState<'all' | StashItemType>('all');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const scanInputRef = useRef<HTMLInputElement>(null);

  // Photo of a ball band → AI vision → pre-filled form. The reason stashes
  // stay empty is typing; this removes the typing.
  const scanMutation = useMutation({
    mutationFn: async (file: File) => {
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await apiRequest('POST', '/api/stash/scan-label', { imageBase64 });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Could not read the label');
      }
      return res.json() as Promise<{ type: StashItemType; name: string; color?: string; volume?: string; size?: string; notes?: string }>;
    },
    onSuccess: (scanned) => {
      if (!scanned.name) {
        toast({ title: "Couldn't read a label", description: scanned.notes || 'Try a clearer, closer photo of the ball band.', variant: 'destructive' });
        return;
      }
      setForm((f) => ({
        ...f,
        type: scanned.type || f.type,
        name: scanned.name,
        color: scanned.color ?? f.color,
        volume: scanned.volume ?? f.volume,
        size: scanned.size ?? f.size,
        notes: scanned.notes ?? f.notes,
      }));
      toast({ title: 'Label read! 📷', description: 'Check the details and tweak anything I misread.' });
    },
    onError: (err) => toast({ title: "Couldn't scan the label", description: err instanceof Error ? err.message : 'Please try again.', variant: 'destructive' }),
  });
  const [notes, setNotes] = useState('');

  const { data: items, isLoading, isError } = useQuery<StashItem[]>({
    queryKey: ['/api/stash'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/stash');
      if (!res.ok) throw new Error('Failed to load materials');
      return res.json();
    },
    staleTime: 1000 * 60,
  });

  const { data: notesData } = useQuery<{ content: string }>({
    queryKey: ['/api/stash-notes'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/stash-notes');
      if (!res.ok) throw new Error('Failed to load notes');
      return res.json();
    },
    staleTime: 1000 * 60,
  });

  useEffect(() => {
    if (notesData?.content !== undefined) setNotes(notesData.content);
  }, [notesData]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['/api/stash'] });

  const createMutation = useMutation({
    mutationFn: async (payload: Omit<StashItem, 'id'>) => {
      const res = await apiRequest('POST', '/api/stash', payload);
      if (!res.ok) throw new Error('Failed to add item');
      return res.json();
    },
    onSuccess: () => { invalidate(); toast({ title: 'Material added' }); },
    onError: () => toast({ title: 'Could not add material', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Omit<StashItem, 'id'> }) => {
      const res = await apiRequest('PUT', `/api/stash/${id}`, payload);
      if (!res.ok) throw new Error('Failed to update item');
      return res.json();
    },
    onSuccess: () => { invalidate(); toast({ title: 'Material updated' }); },
    onError: () => toast({ title: 'Could not update material', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('DELETE', `/api/stash/${id}`);
      if (!res.ok) throw new Error('Failed to delete item');
      return id;
    },
    onSuccess: () => { invalidate(); toast({ title: 'Material removed' }); },
    onError: () => toast({ title: 'Could not remove material', variant: 'destructive' }),
  });

  const saveNotesMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest('PUT', '/api/stash-notes', { content });
      if (!res.ok) throw new Error('Failed to save notes');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stash-notes'] });
      toast({ title: 'Notes saved' });
    },
    onError: () => toast({ title: 'Could not save notes', variant: 'destructive' }),
  });

  const openAdd = () => { setEditingId(null); setForm(emptyForm(filter === 'all' ? 'yarn' : filter)); setDialogOpen(true); };
  const openEdit = (item: StashItem) => {
    setEditingId(item.id);
    setForm({
      type: item.type,
      name: item.name || '',
      color: item.color || '',
      volume: item.volume || '',
      size: item.size || '',
      description: item.description || '',
      quantity: item.quantity || 1,
      notes: item.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast({ title: 'Please give the material a name', variant: 'destructive' });
      return;
    }
    const payload = buildPayload(form);
    if (editingId) updateMutation.mutate({ id: editingId, payload });
    else createMutation.mutate(payload);
    setDialogOpen(false);
  };

  const handleDelete = (item: StashItem) => {
    if (window.confirm(`Remove “${item.name}” from your materials?`)) deleteMutation.mutate(item.id);
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: 0, yarn: 0, hook: 0, notion: 0, tool: 0 };
    (items || []).forEach((i) => { c.all++; c[i.type] = (c[i.type] || 0) + 1; });
    return c;
  }, [items]);

  const visible = useMemo(() => {
    let list = [...(items || [])];
    if (filter !== 'all') list = list.filter((i) => i.type === filter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((i) =>
        i.name?.toLowerCase().includes(q) ||
        i.color?.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q) ||
        i.size?.toLowerCase().includes(q),
      );
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [items, filter, search]);

  const hasItems = !!items && items.length > 0;

  return (
    <div className="surface-card mb-8 p-5 sm:p-7">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">My Stash</h2>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary-600 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          Add material
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      ) : isError ? (
        <p className="py-8 text-center text-destructive">Couldn&rsquo;t load your materials. Please refresh.</p>
      ) : (
        <>
          {hasItems && (
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-wrap gap-1.5">
                {(['all', ...TYPES.map((t) => t.key)] as const).map((key) => {
                  const label = key === 'all' ? 'All' : TYPES.find((t) => t.key === key)!.plural;
                  const active = filter === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setFilter(key)}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                        active ? 'border-primary-200 bg-primary-50 text-primary-700' : 'border-input text-gray-600 hover:bg-gray-100',
                      )}
                    >
                      {label} <span className="text-xs opacity-70">{counts[key] ?? 0}</span>
                    </button>
                  );
                })}
              </div>
              <div className="relative sm:ml-auto sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search materials…"
                  aria-label="Search materials"
                  className="w-full rounded-full border border-input bg-background py-2 pl-9 pr-4 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
          )}

          {!hasItems ? (
            <div className="py-12 text-center">
              <WoolBallIcon className="mx-auto h-16 w-16 text-gray-300" />
              <h3 className="mt-3 font-heading text-lg font-medium text-foreground">Your stash is empty</h3>
              <p className="mt-1 text-sm text-gray-500">Add the yarn, hooks and notions you have on hand.</p>
              <button
                onClick={openAdd}
                className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary-600"
              >
                <Plus className="h-5 w-5" /> Add your first material
              </button>
            </div>
          ) : visible.length === 0 ? (
            <p className="py-10 text-center text-gray-500">No materials match your search.</p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {visible.map((item) => (
                <li key={item.id} className="flex items-center gap-3 p-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                    {item.type === 'yarn'
                      ? <WoolBallIcon className="h-6 w-6 text-primary" />
                      : <Package className="h-5 w-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{item.name}</p>
                    {itemDetail(item) && <p className="truncate text-sm text-gray-500">{itemDetail(item)}</p>}
                  </div>
                  {item.quantity > 1 && (
                    <span className="shrink-0 rounded-full bg-secondary-100 px-2 py-0.5 text-xs font-medium text-secondary-800">×{item.quantity}</span>
                  )}
                  <button onClick={() => openEdit(item)} aria-label={`Edit ${item.name}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(item)} aria-label={`Remove ${item.name}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Shared materials notes */}
          <div className="mt-8">
            <Label htmlFor="materials-notes" className="font-heading text-base text-foreground">Materials notes</Label>
            <Textarea
              id="materials-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Wishlist, dye lots, where things are stored…"
              rows={3}
              className="mt-2"
            />
            <div className="mt-2 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => saveNotesMutation.mutate(notes)} disabled={saveNotesMutation.isPending}>
                {saveNotesMutation.isPending ? 'Saving…' : 'Save notes'}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Add / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="font-heading">{editingId ? 'Edit material' : 'Add material'}</DialogTitle>
            <DialogDescription>Track what&rsquo;s in your stash so patterns can reference it.</DialogDescription>
          </DialogHeader>

          {/* Scan a ball band instead of typing */}
          <input
            ref={scanInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) scanMutation.mutate(f); e.target.value = ''; }}
          />
          <button
            type="button"
            onClick={() => scanInputRef.current?.click()}
            disabled={scanMutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12.5px] font-bold transition-all hover:opacity-90 disabled:opacity-60"
            style={{ background: 'rgba(124,95,168,0.10)', color: '#7C5FA8', border: '1.5px dashed rgba(124,95,168,0.4)' }}
          >
            📷 {scanMutation.isPending ? 'Reading the label…' : 'Scan the ball band — I\'ll fill this in'}
          </button>

          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="m-type">Type</Label>
              <select
                id="m-type"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as StashItemType }))}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                {TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="m-name">Name</Label>
              <Input id="m-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder={form.type === 'yarn' ? 'e.g. Paintbox Cotton Aran' : 'e.g. Clover Amour'} />
            </div>

            {form.type === 'yarn' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="m-color">Colour</Label>
                  <Input id="m-color" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} placeholder="Rose Pink" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="m-volume">Amount</Label>
                  <Input id="m-volume" value={form.volume} onChange={(e) => setForm((f) => ({ ...f, volume: e.target.value }))} placeholder="~50g / 120m" />
                </div>
              </div>
            )}

            {form.type === 'hook' && (
              <div className="grid gap-1.5">
                <Label htmlFor="m-size">Size</Label>
                <Input id="m-size" value={form.size} onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))} placeholder="5.0mm (H/8)" />
              </div>
            )}

            {(form.type === 'notion' || form.type === 'tool') && (
              <div className="grid gap-1.5">
                <Label htmlFor="m-desc">Description</Label>
                <Input id="m-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder={form.type === 'notion' ? '12mm safety eyes' : 'Tapestry needle'} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="m-qty">Quantity</Label>
                <Input id="m-qty" type="number" min={1} inputMode="numeric" value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: Math.max(1, parseInt(e.target.value, 10) || 1) }))} />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="m-notes">Notes</Label>
              <Textarea id="m-notes" rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingId ? 'Save changes' : 'Add material'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MaterialsInventory;
