import { db } from './db';
import { ProjectEvent, projectEvents } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const projectEventService = {
  async getAllEvents(): Promise<ProjectEvent[]> {
    try {
      const events = await db.select().from(projectEvents).orderBy(projectEvents.date);
      return events.map(event => ({
        ...event,
        completed: !!event.completed, // Convert integer to boolean
        // Convert dates to strings for API consistency
        createdAt: event.createdAt ? event.createdAt.toISOString() : undefined,
        updatedAt: event.updatedAt ? event.updatedAt.toISOString() : undefined,
        date: event.date instanceof Date ? event.date.toISOString() : event.date,
      })) as unknown as ProjectEvent[];
    } catch (error) {
      console.error('Error getting project events:', error);
      throw new Error('Failed to retrieve project events');
    }
  },

  async getEvent(id: string): Promise<ProjectEvent | undefined> {
    try {
      const events = await db.select().from(projectEvents).where(eq(projectEvents.id, id));
      if (events.length === 0) {
        return undefined;
      }
      
      const event = events[0];
      return {
        ...event,
        completed: !!event.completed, // Convert integer to boolean
        // Convert dates to strings for API consistency
        createdAt: event.createdAt ? event.createdAt.toISOString() : undefined,
        updatedAt: event.updatedAt ? event.updatedAt.toISOString() : undefined,
        date: event.date instanceof Date ? event.date.toISOString() : event.date,
      } as unknown as ProjectEvent;
    } catch (error) {
      console.error(`Error getting project event with id ${id}:`, error);
      throw new Error('Failed to retrieve project event');
    }
  },

  async createEvent(event: Omit<ProjectEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectEvent> {
    try {
      const id = uuidv4();
      const date = event.date instanceof Date ? event.date : new Date(event.date);
      
      const newEvent = {
        id,
        title: event.title,
        patternId: event.patternId,
        patternTitle: event.patternTitle,
        date,
        description: event.description || '',
        completed: event.completed ? 1 : 0, // Convert boolean to integer
        timeEstimate: event.timeEstimate || 0,
      };

      await db.insert(projectEvents).values(newEvent);
      return await this.getEvent(id) as ProjectEvent;
    } catch (error) {
      console.error('Error creating project event:', error);
      throw new Error('Failed to create project event');
    }
  },

  async updateEvent(id: string, event: Partial<ProjectEvent>): Promise<ProjectEvent | undefined> {
    try {
      const updateData: any = { ...event };
      
      // Handle date conversion if provided
      if (event.date) {
        updateData.date = event.date instanceof Date ? event.date : new Date(event.date);
      }
      
      // Convert completed boolean to integer if provided
      if (typeof event.completed === 'boolean') {
        updateData.completed = event.completed ? 1 : 0;
      }
      
      await db.update(projectEvents)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(projectEvents.id, id));
      
      return await this.getEvent(id);
    } catch (error) {
      console.error(`Error updating project event with id ${id}:`, error);
      throw new Error('Failed to update project event');
    }
  },

  async deleteEvent(id: string): Promise<boolean> {
    try {
      const result = await db.delete(projectEvents).where(eq(projectEvents.id, id));
      return true;
    } catch (error) {
      console.error(`Error deleting project event with id ${id}:`, error);
      throw new Error('Failed to delete project event');
    }
  }
};