import React, { useState } from 'react';
import { Edit, Trash, Plus, Save, X, Search } from 'lucide-react';
import { YarnIcon, WoolBallIcon } from '../icons/WoolIcons';
import { StashItem } from '../lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { apiRequest } from '../lib/queryClient';
import { useToast } from '../hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function YarnStash() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("yarn");
  const [searchTerm, setSearchTerm] = useState('');
  const [notes, setNotes] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StashItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<StashItem>>({
    type: 'yarn',
    name: '',
    color: '',
    volume: '',
    quantity: 1
  });

  // Fetch stash items with optimized configuration
  const { data: stashItems = [], isLoading, error: stashError } = useQuery({
    queryKey: ['stashItems'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/stash');
        return response.json();
      } catch (error) {
        console.error('Error fetching stash:', error);
        toast({
          title: "Failed to Load Items",
          description: "There was an error loading your stash items. Please try again.",
          variant: "destructive"
        });
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 2
  });

  // Fetch stash notes with optimized configuration
  const { data: stashNotes = "", error: notesError } = useQuery({
    queryKey: ['stashNotes'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/stash-notes');
        const data = await response.json();
        // Use the content field if API returns it, otherwise use notes field
        const notesContent = data.content || data.notes || "";
        setNotes(notesContent);
        return notesContent;
      } catch (error) {
        console.error('Error fetching stash notes:', error);
        toast({
          title: "Failed to Load Notes",
          description: "There was an error loading your stash notes.",
          variant: "destructive"
        });
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 2
  });

  // Add item mutation
  const addItemMutation = useMutation({
    mutationFn: async (newItem: Partial<StashItem>) => {
      const res = await apiRequest('POST', '/api/stash', newItem);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stashItems'] });
      setIsAddDialogOpen(false);
      resetNewItem();
      toast({
        title: "Item Added",
        description: "Your stash item has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Add Item",
        description: "There was an error adding your item to the stash.",
        variant: "destructive",
      });
    }
  });

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: async (item: StashItem) => {
      const res = await apiRequest('PUT', `/api/stash/${item.id}`, item);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stashItems'] });
      setEditingItem(null);
      toast({
        title: "Item Updated",
        description: "Your stash item has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "There was an error updating your stash item.",
        variant: "destructive",
      });
    }
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('DELETE', `/api/stash/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stashItems'] });
      toast({
        title: "Item Deleted",
        description: "Your stash item has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "There was an error removing your stash item.",
        variant: "destructive",
      });
    }
  });

  // Update notes mutation
  const updateNotesMutation = useMutation({
    mutationFn: async (notes: string) => {
      const res = await apiRequest('PUT', '/api/stash-notes', { content: notes });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stashNotes'] });
      toast({
        title: "Notes Updated",
        description: "Your stash notes have been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "There was an error updating your notes.",
        variant: "destructive",
      });
    }
  });

  // Reset new item form
  const resetNewItem = () => {
    setNewItem({
      type: activeTab as 'yarn' | 'hook' | 'notion' | 'tool',
      name: '',
      color: '',
      volume: '',
      quantity: 1
    });
  };

  // Filter items by type and search term
  const filteredItems = stashItems.filter((item: StashItem) => {
    const matchesType = item.type === activeTab;
    const matchesSearch = searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.color && item.color.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesType && matchesSearch;
  });

  // Handle add button click
  const handleAddClick = () => {
    setNewItem({
      ...newItem,
      type: activeTab as 'yarn' | 'hook' | 'notion' | 'tool'
    });
    setIsAddDialogOpen(true);
  };

  // Handle save new item
  const handleSaveNewItem = () => {
    addItemMutation.mutate(newItem as StashItem);
  };

  // Handle edit item
  const handleEditItem = (item: StashItem) => {
    setEditingItem(item);
  };

  // Handle save edited item
  const handleSaveEditedItem = () => {
    if (editingItem) {
      updateItemMutation.mutate(editingItem);
    }
  };

  // Handle delete item
  const handleDeleteItem = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      deleteItemMutation.mutate(id);
    }
  };

  // Handle notes save
  const handleSaveNotes = () => {
    updateNotesMutation.mutate(notes);
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchTerm('');
  };

  // Fetch all patterns to check for material usage
  const { data: patterns = [] } = useQuery({
    queryKey: ['patterns'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/patterns');
        return response.json();
      } catch (error) {
        console.error('Error fetching patterns:', error);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: stashItems.length > 0 // Only fetch patterns if there are stash items
  });

  // Calculate material usage based on patterns
  const estimateUsage = (item: StashItem) => {
    if (!patterns || patterns.length === 0) {
      return "Checking usage...";
    }

    // Find patterns that use this item
    const matchingPatterns = patterns.filter((pattern: any) => {
      // For yarn items
      if (item.type === 'yarn' && pattern.yarnRequirements) {
        return pattern.yarnRequirements.some((yarn: any) => 
          (yarn.color && item.color && 
           yarn.color.toLowerCase().includes(item.color.toLowerCase())) || 
          (yarn.color && item.name && 
           yarn.color.toLowerCase().includes(item.name.toLowerCase()))
        );
      }
      
      // For hook items
      if (item.type === 'hook' && pattern.hookRequirements) {
        return pattern.hookRequirements.some((hook: any) => 
          hook.size === item.name || 
          (hook.size && item.description && hook.size.includes(item.description))
        );
      }
      
      // For notions
      if (item.type === 'notion' && pattern.notionsRequirements) {
        return pattern.notionsRequirements.some((notion: any) => 
          notion.name === item.name ||
          (notion.description && item.description && 
           notion.description.toLowerCase().includes(item.description.toLowerCase()))
        );
      }
      
      // For tools
      if (item.type === 'tool' && pattern.toolRequirements) {
        return pattern.toolRequirements.some((tool: any) => 
          tool.name === item.name ||
          (tool.description && item.description && 
           tool.description.toLowerCase().includes(item.description.toLowerCase()))
        );
      }
      
      return false;
    });
    
    if (matchingPatterns.length === 0) {
      return "Not used in any project";
    } else if (matchingPatterns.length === 1) {
      return `Used in: ${matchingPatterns[0].title}`;
    } else {
      return `Used in ${matchingPatterns.length} projects`;
    }
  };

  return (
    <div className="bg-white shadow-md rounded-2xl p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-secondary-600 font-heading flex items-center">
          <WoolBallIcon className="mr-2 h-6 w-6 text-primary" />
          Yarn & Material Stash
        </h2>
        <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
          {stashItems.length} items in stash
        </div>
      </div>

      <div className="flex space-x-4 mb-6">
        <div className="flex-1 relative">
          <Input
            type="text"
            placeholder="Search your stash..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>
        <Button onClick={handleAddClick} className="shrink-0">
          <Plus className="h-5 w-5 mr-1" /> Add Item
        </Button>
      </div>

      <Tabs defaultValue="yarn" value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="yarn" className="flex-1">Yarn</TabsTrigger>
          <TabsTrigger value="hook" className="flex-1">Hooks</TabsTrigger>
          <TabsTrigger value="notion" className="flex-1">Notions</TabsTrigger>
          <TabsTrigger value="tool" className="flex-1">Tools</TabsTrigger>
        </TabsList>

        {/* Yarn Tab */}
        <TabsContent value="yarn" className="space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-gray-200 rounded-lg">
              <WoolBallIcon className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">No yarn in your stash yet.</p>
              <Button onClick={handleAddClick} variant="outline" className="mt-4">
                <Plus className="h-4 w-4 mr-1" /> Add Yarn
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredItems.map((item: StashItem) => (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100 hover:shadow-md transition-shadow"
                >
                  {editingItem && editingItem.id === item.id ? (
                    // Edit mode
                    <div className="flex-grow grid grid-cols-3 gap-2">
                      <div>
                        <Label htmlFor={`name-${item.id}`} className="text-xs">Name</Label>
                        <Input
                          id={`name-${item.id}`}
                          value={editingItem.name}
                          onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`color-${item.id}`} className="text-xs">Color</Label>
                        <Input
                          id={`color-${item.id}`}
                          value={editingItem.color || ''}
                          onChange={(e) => setEditingItem({...editingItem, color: e.target.value})}
                          className="mt-1"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor={`volume-${item.id}`} className="text-xs">Volume</Label>
                          <Input
                            id={`volume-${item.id}`}
                            value={editingItem.volume || ''}
                            onChange={(e) => setEditingItem({...editingItem, volume: e.target.value})}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`quantity-${item.id}`} className="text-xs">Qty</Label>
                          <Input
                            id={`quantity-${item.id}`}
                            type="number"
                            value={editingItem.quantity}
                            onChange={(e) => setEditingItem({...editingItem, quantity: parseInt(e.target.value) || 1})}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div className="col-span-3">
                        <Label htmlFor={`notes-${item.id}`} className="text-xs">Notes</Label>
                        <Textarea
                          id={`notes-${item.id}`}
                          value={editingItem.notes || ''}
                          onChange={(e) => setEditingItem({...editingItem, notes: e.target.value})}
                          className="mt-1"
                          rows={2}
                        />
                      </div>
                    </div>
                  ) : (
                    // Display mode
                    <>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color?.toLowerCase() || '#ccc' }}></div>
                        <div>
                          <h3 className="font-medium">{item.name}</h3>
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            {item.color && <span>{item.color}</span>}
                            {item.volume && <span>·</span>}
                            {item.volume && <span>{item.volume}</span>}
                            <span>·</span>
                            <span>{item.quantity} {item.quantity > 1 ? 'skeins' : 'skein'}</span>
                          </div>
                          {item.notes && <p className="text-xs text-gray-500 mt-1">{item.notes}</p>}
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        <div className="text-gray-500">{estimateUsage(item)}</div>
                      </div>
                    </>
                  )}
                  <div className="flex space-x-2 ml-4">
                    {editingItem && editingItem.id === item.id ? (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={handleSaveEditedItem}
                          className="h-8 w-8 p-0 text-green-600"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setEditingItem(null)}
                          className="h-8 w-8 p-0 text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditItem(item)}
                          className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteItem(item.id)}
                          className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Hooks Tab */}
        <TabsContent value="hook" className="space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-gray-200 rounded-lg">
              <p className="mt-4 text-gray-500">No hooks in your stash yet.</p>
              <Button onClick={handleAddClick} variant="outline" className="mt-4">
                <Plus className="h-4 w-4 mr-1" /> Add Hook
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredItems.map((item: StashItem) => (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100 hover:shadow-md transition-shadow"
                >
                  {editingItem && editingItem.id === item.id ? (
                    // Edit mode for hooks
                    <div className="flex-grow grid grid-cols-3 gap-2">
                      <div>
                        <Label htmlFor={`name-${item.id}`} className="text-xs">Name</Label>
                        <Input
                          id={`name-${item.id}`}
                          value={editingItem.name}
                          onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`size-${item.id}`} className="text-xs">Size</Label>
                        <Input
                          id={`size-${item.id}`}
                          value={editingItem.size || ''}
                          onChange={(e) => setEditingItem({...editingItem, size: e.target.value})}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`quantity-${item.id}`} className="text-xs">Quantity</Label>
                        <Input
                          id={`quantity-${item.id}`}
                          type="number"
                          value={editingItem.quantity}
                          onChange={(e) => setEditingItem({...editingItem, quantity: parseInt(e.target.value) || 1})}
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-3">
                        <Label htmlFor={`notes-${item.id}`} className="text-xs">Notes</Label>
                        <Textarea
                          id={`notes-${item.id}`}
                          value={editingItem.notes || ''}
                          onChange={(e) => setEditingItem({...editingItem, notes: e.target.value})}
                          className="mt-1"
                          rows={2}
                        />
                      </div>
                    </div>
                  ) : (
                    // Display mode for hooks
                    <>
                      <div className="flex items-center">
                        <div>
                          <h3 className="font-medium">{item.name}</h3>
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            {item.size && <span>Size: {item.size}</span>}
                            <span>·</span>
                            <span>{item.quantity} {item.quantity > 1 ? 'hooks' : 'hook'}</span>
                          </div>
                          {item.notes && <p className="text-xs text-gray-500 mt-1">{item.notes}</p>}
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        <div className="text-gray-500">{estimateUsage(item)}</div>
                      </div>
                    </>
                  )}
                  <div className="flex space-x-2 ml-4">
                    {editingItem && editingItem.id === item.id ? (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={handleSaveEditedItem}
                          className="h-8 w-8 p-0 text-green-600"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setEditingItem(null)}
                          className="h-8 w-8 p-0 text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditItem(item)}
                          className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteItem(item.id)}
                          className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Notions Tab */}
        <TabsContent value="notion" className="space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-gray-200 rounded-lg">
              <p className="mt-4 text-gray-500">No notions in your stash yet.</p>
              <Button onClick={handleAddClick} variant="outline" className="mt-4">
                <Plus className="h-4 w-4 mr-1" /> Add Notion
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredItems.map((item: StashItem) => (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100 hover:shadow-md transition-shadow"
                >
                  {editingItem && editingItem.id === item.id ? (
                    // Edit mode for notions
                    <div className="flex-grow grid grid-cols-3 gap-2">
                      <div>
                        <Label htmlFor={`name-${item.id}`} className="text-xs">Name</Label>
                        <Input
                          id={`name-${item.id}`}
                          value={editingItem.name}
                          onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`description-${item.id}`} className="text-xs">Description</Label>
                        <Input
                          id={`description-${item.id}`}
                          value={editingItem.description || ''}
                          onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`quantity-${item.id}`} className="text-xs">Quantity</Label>
                        <Input
                          id={`quantity-${item.id}`}
                          type="number"
                          value={editingItem.quantity}
                          onChange={(e) => setEditingItem({...editingItem, quantity: parseInt(e.target.value) || 1})}
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-3">
                        <Label htmlFor={`notes-${item.id}`} className="text-xs">Notes</Label>
                        <Textarea
                          id={`notes-${item.id}`}
                          value={editingItem.notes || ''}
                          onChange={(e) => setEditingItem({...editingItem, notes: e.target.value})}
                          className="mt-1"
                          rows={2}
                        />
                      </div>
                    </div>
                  ) : (
                    // Display mode for notions
                    <>
                      <div className="flex items-center">
                        <div>
                          <h3 className="font-medium">{item.name}</h3>
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            {item.description && <span>{item.description}</span>}
                            <span>·</span>
                            <span>{item.quantity} {item.quantity > 1 ? 'pieces' : 'piece'}</span>
                          </div>
                          {item.notes && <p className="text-xs text-gray-500 mt-1">{item.notes}</p>}
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        <div className="text-gray-500">{estimateUsage(item)}</div>
                      </div>
                    </>
                  )}
                  <div className="flex space-x-2 ml-4">
                    {editingItem && editingItem.id === item.id ? (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={handleSaveEditedItem}
                          className="h-8 w-8 p-0 text-green-600"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setEditingItem(null)}
                          className="h-8 w-8 p-0 text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditItem(item)}
                          className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteItem(item.id)}
                          className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tool" className="space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-gray-200 rounded-lg">
              <p className="mt-4 text-gray-500">No tools in your stash yet.</p>
              <Button onClick={handleAddClick} variant="outline" className="mt-4">
                <Plus className="h-4 w-4 mr-1" /> Add Tool
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredItems.map((item: StashItem) => (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100 hover:shadow-md transition-shadow"
                >
                  {editingItem && editingItem.id === item.id ? (
                    // Edit mode for tools
                    <div className="flex-grow grid grid-cols-3 gap-2">
                      <div>
                        <Label htmlFor={`name-${item.id}`} className="text-xs">Name</Label>
                        <Input
                          id={`name-${item.id}`}
                          value={editingItem.name}
                          onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`description-${item.id}`} className="text-xs">Description</Label>
                        <Input
                          id={`description-${item.id}`}
                          value={editingItem.description || ''}
                          onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`quantity-${item.id}`} className="text-xs">Quantity</Label>
                        <Input
                          id={`quantity-${item.id}`}
                          type="number"
                          value={editingItem.quantity}
                          onChange={(e) => setEditingItem({...editingItem, quantity: parseInt(e.target.value) || 1})}
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-3">
                        <Label htmlFor={`notes-${item.id}`} className="text-xs">Notes</Label>
                        <Textarea
                          id={`notes-${item.id}`}
                          value={editingItem.notes || ''}
                          onChange={(e) => setEditingItem({...editingItem, notes: e.target.value})}
                          className="mt-1"
                          rows={2}
                        />
                      </div>
                    </div>
                  ) : (
                    // Display mode for tools
                    <>
                      <div className="flex items-center">
                        <div>
                          <h3 className="font-medium">{item.name}</h3>
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            {item.description && <span>{item.description}</span>}
                            {item.quantity > 1 && (
                              <>
                                <span>·</span>
                                <span>{item.quantity} pieces</span>
                              </>
                            )}
                          </div>
                          {item.notes && <p className="text-xs text-gray-500 mt-1">{item.notes}</p>}
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        <div className="text-gray-500">{estimateUsage(item)}</div>
                      </div>
                    </>
                  )}
                  <div className="flex space-x-2 ml-4">
                    {editingItem && editingItem.id === item.id ? (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={handleSaveEditedItem}
                          className="h-8 w-8 p-0 text-green-600"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setEditingItem(null)}
                          className="h-8 w-8 p-0 text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditItem(item)}
                          className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteItem(item.id)}
                          className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Notes Section */}
      <div className="mt-8">
        <h3 className="font-medium mb-2">Materials Notes</h3>
        <div className="flex space-x-2">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional notes on your materials..."
            className="flex-1"
            rows={3}
          />
          <Button
            onClick={handleSaveNotes}
            className="self-end"
          >
            Save Notes
          </Button>
        </div>
      </div>

      {/* Add Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add to Your Stash</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {activeTab === 'yarn' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="newName">Name</Label>
                    <Input
                      id="newName"
                      value={newItem.name}
                      onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                      placeholder="Soft Cotton Yarn"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newColor">Color</Label>
                    <Input
                      id="newColor"
                      value={newItem.color || ''}
                      onChange={(e) => setNewItem({...newItem, color: e.target.value})}
                      placeholder="Sky Blue"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="newVolume">Volume</Label>
                    <Input
                      id="newVolume"
                      value={newItem.volume || ''}
                      onChange={(e) => setNewItem({...newItem, volume: e.target.value})}
                      placeholder="100g / 220 yards"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newQuantity">Quantity</Label>
                    <Input
                      id="newQuantity"
                      type="number"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 1})}
                      min={1}
                    />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'hook' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="newName">Name</Label>
                    <Input
                      id="newName"
                      value={newItem.name}
                      onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                      placeholder="Clover Amour"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newSize">Size</Label>
                    <Input
                      id="newSize"
                      value={newItem.size || ''}
                      onChange={(e) => setNewItem({...newItem, size: e.target.value})}
                      placeholder="5.0mm / H-8"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="newQuantity">Quantity</Label>
                  <Input
                    id="newQuantity"
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 1})}
                    min={1}
                  />
                </div>
              </>
            )}

            {activeTab === 'notion' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="newName">Name</Label>
                    <Input
                      id="newName"
                      value={newItem.name}
                      onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                      placeholder="Safety Eyes"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newDescription">Description</Label>
                    <Input
                      id="newDescription"
                      value={newItem.description || ''}
                      onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                      placeholder="10mm Black"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="newQuantity">Quantity</Label>
                  <Input
                    id="newQuantity"
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 1})}
                    min={1}
                  />
                </div>
              </>
            )}

            {activeTab === 'tool' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="newName">Name</Label>
                    <Input
                      id="newName"
                      value={newItem.name}
                      onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                      placeholder="Tapestry Needle"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newDescription">Description</Label>
                    <Input
                      id="newDescription"
                      value={newItem.description || ''}
                      onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                      placeholder="Blunt tip, large eye"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="newQuantity">Quantity</Label>
                  <Input
                    id="newQuantity"
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 1})}
                    min={1}
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="newNotes">Notes</Label>
              <Textarea
                id="newNotes"
                value={newItem.notes || ''}
                onChange={(e) => setNewItem({...newItem, notes: e.target.value})}
                placeholder="Any additional information..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNewItem}>
              Add to Stash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}