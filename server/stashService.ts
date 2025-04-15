import { db } from './db';
import { stashItems, stashNotes, StashItem } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const stashService = {
  // Get all stash items
  async getAllItems(): Promise<StashItem[]> {
    try {
      return await db.select().from(stashItems);
    } catch (error) {
      console.error('Error fetching stash items:', error);
      throw error;
    }
  },

  // Get a single stash item by ID
  async getItem(id: string): Promise<StashItem | undefined> {
    try {
      const results = await db.select().from(stashItems).where(eq(stashItems.id, id));
      return results[0];
    } catch (error) {
      console.error(`Error fetching stash item ${id}:`, error);
      throw error;
    }
  },

  // Create a new stash item
  async createItem(item: Omit<StashItem, 'id'>): Promise<StashItem> {
    try {
      const newItem = { ...item, id: uuidv4() };
      await db.insert(stashItems).values(newItem);
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
      const result = await db.delete(stashItems).where(eq(stashItems.id, id));
      return !!result;
    } catch (error) {
      console.error(`Error deleting stash item ${id}:`, error);
      throw error;
    }
  },

  // Get stash notes
  async getNotes(): Promise<string> {
    try {
      const results = await db.select().from(stashNotes);
      return results[0]?.content || '';
    } catch (error) {
      console.error('Error fetching stash notes:', error);
      throw error;
    }
  },

  // Update stash notes
  async updateNotes(content: string): Promise<string> {
    try {
      const results = await db.select().from(stashNotes);
      
      if (results.length > 0) {
        await db.update(stashNotes).set({ content }).where(eq(stashNotes.id, results[0].id));
      } else {
        await db.insert(stashNotes).values({ id: uuidv4(), content });
      }
      
      return content;
    } catch (error) {
      console.error('Error updating stash notes:', error);
      throw error;
    }
  }
};