import { db } from './db';
import { stashItems, stashNotes, StashItem } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const stashService = {
  // Get all stash items (scoped to a profile when provided)
  async getAllItems(ownerId?: string): Promise<StashItem[]> {
    try {
      const base = db.select().from(stashItems);
      const items = await (ownerId ? base.where(eq(stashItems.ownerId, ownerId)) : base);
      return items.map(item => ({
        id: item.id,
        type: item.type as "yarn" | "hook" | "notion" | "tool",
        name: item.name,
        quantity: item.quantity,
        color: item.color || undefined,
        volume: item.volume || undefined,
        size: item.size || undefined,
        description: item.description || undefined,
        notes: item.notes || undefined
      }));
    } catch (error) {
      console.error('Error fetching stash items:', error);
      throw error;
    }
  },

  // Get a single stash item by ID
  async getItem(id: string): Promise<StashItem | undefined> {
    try {
      const results = await db.select().from(stashItems).where(eq(stashItems.id, id));
      if (results.length === 0) return undefined;
      
      const item = results[0];
      return {
        id: item.id,
        type: item.type as "yarn" | "hook" | "notion" | "tool",
        name: item.name,
        quantity: item.quantity,
        color: item.color || undefined,
        volume: item.volume || undefined,
        size: item.size || undefined,
        description: item.description || undefined,
        notes: item.notes || undefined
      };
    } catch (error) {
      console.error(`Error fetching stash item ${id}:`, error);
      throw error;
    }
  },

  // Create a new stash item
  async createItem(item: Omit<StashItem, 'id'>, ownerId?: string): Promise<StashItem> {
    try {
      const newItem = { ...item, id: uuidv4() };
      await db.insert(stashItems).values({ ...newItem, ownerId: ownerId ?? 'larissa' });
      return newItem;
    } catch (error) {
      console.error('Error creating stash item:', error);
      throw error;
    }
  },

  // Update an existing stash item
  async updateItem(id: string, item: Partial<StashItem>): Promise<StashItem | undefined> {
    try {
      await db.update(stashItems).set(item).where(eq(stashItems.id, id));
      return this.getItem(id);
    } catch (error) {
      console.error(`Error updating stash item ${id}:`, error);
      throw error;
    }
  },

  // Delete a stash item
  async deleteItem(id: string): Promise<boolean> {
    try {
      const result = await db.delete(stashItems).where(eq(stashItems.id, id)).returning({ id: stashItems.id });
      return result.length > 0;
    } catch (error) {
      console.error(`Error deleting stash item ${id}:`, error);
      throw error;
    }
  },

  // Get stash notes (one notes row per profile)
  async getNotes(ownerId: string = 'larissa'): Promise<string> {
    try {
      const results = await db.select().from(stashNotes).where(eq(stashNotes.ownerId, ownerId));
      return results[0]?.content || '';
    } catch (error) {
      console.error('Error fetching stash notes:', error);
      throw error;
    }
  },

  // Update stash notes
  async updateNotes(content: string, ownerId: string = 'larissa'): Promise<string> {
    try {
      const results = await db.select().from(stashNotes).where(eq(stashNotes.ownerId, ownerId));

      if (results.length > 0) {
        await db.update(stashNotes).set({ content }).where(eq(stashNotes.id, results[0].id));
      } else {
        await db.insert(stashNotes).values({ id: uuidv4(), content, ownerId });
      }

      return content;
    } catch (error) {
      console.error('Error updating stash notes:', error);
      throw error;
    }
  }
};