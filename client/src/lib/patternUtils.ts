/**
 * Utility functions for pattern-related calculations
 */
import { Pattern, ProjectEvent } from "./types";

// Crochet speeds in minutes per stitch for different project types
export const CROCHET_SPEEDS: Record<string, number> = {
  'amigurumi': 20,
  'blanket': 15,
  'garment': 18,
  'hat': 16,
  'scarf': 12,
  'accessory': 14,
  'other': 12
};

/**
 * Calculate time estimate based on pattern complexity
 * @param pattern - The pattern to calculate time estimate for
 * @returns Estimated time in minutes
 */
export function calculateTimeEstimate(pattern: Pattern): number {
  if (!pattern) return 0;
  
  // Set default values for undefined properties
  const projectType = pattern.projectType || 'other';
  const speed = CROCHET_SPEEDS[projectType] || CROCHET_SPEEDS.other;
  
  // Count total steps - with extensive null checking
  let totalSteps = 0;
  if (pattern.sections && Array.isArray(pattern.sections)) {
    pattern.sections.forEach(section => {
      if (section && section.steps && Array.isArray(section.steps)) {
        totalSteps += section.steps.length;
      }
    });
  }
  
  // Ensure at least some estimated time even if no steps are defined
  const minTime = 60; // 1 hour minimum
  
  // Base time: 30 min per step (simplified model)
  let baseTime = Math.max(totalSteps * 30, minTime);
  
  // Adjust based on difficulty
  switch (pattern.skillLevel) {
    case 'beginner':
      baseTime = baseTime * 1.2;
      break;
    case 'intermediate':
      baseTime = baseTime * 1.0;
      break;
    case 'advanced':
      baseTime = baseTime * 0.8; // Skilled crafters are faster
      break;
    default:
      baseTime = baseTime * 1.0;
  }
  
  return Math.round(baseTime);
}

/**
 * Calculate completion date based on time estimate and daily crochet time
 * @param startDate - The date to start calculating from
 * @param timeEstimate - Estimated time in minutes
 * @param dailyCrochetTime - Available crochet time per day in minutes
 * @param dayAvailabilityMap - Availability status for specific days
 * @returns Estimated completion date
 */
export function calculateCompletionDate(
  startDate: Date, 
  timeEstimate: number, 
  dailyCrochetTime: number,
  dayAvailabilityMap?: Record<string, 'blocked' | 'half' | 'full'>
): Date {
  // If no daily time set, assume it takes one day
  if (!dailyCrochetTime || dailyCrochetTime <= 0) {
    const result = new Date(startDate);
    result.setDate(result.getDate() + 1);
    return result;
  }
  
  // Track remaining minutes
  let remainingMinutes = timeEstimate;
  
  // Clone start date to use as current position
  const currentDate = new Date(startDate);
  let completionDate = new Date(startDate);
  
  // Loop until all time is accounted for
  while (remainingMinutes > 0) {
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
    
    // Determine available time based on day and availability settings
    let availableMinutes = dailyCrochetTime;
    const dateStr = currentDate.toISOString().split('T')[0];
    
    // Check if we have explicit availability settings for this day
    if (dayAvailabilityMap && dateStr in dayAvailabilityMap) {
      const availability = dayAvailabilityMap[dateStr];
      
      if (availability === 'blocked') {
        availableMinutes = 0;
      } else if (availability === 'half') {
        availableMinutes = Math.floor(dailyCrochetTime / 2);
      }
    } else {
      // If not explicitly set, check if it's a weekend
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) { // 0 = Sunday, 6 = Saturday
        availableMinutes = 0; // Weekends blocked by default
      }
    }
    
    // Subtract available time from remaining work
    if (availableMinutes > 0) {
      remainingMinutes -= availableMinutes;
      
      // Update completion date if progress was made
      if (remainingMinutes <= 0) {
        completionDate = new Date(currentDate);
      }
    }
  }
  
  return completionDate;
}

/**
 * Filter events by a specific date
 * @param events - Array of project events
 * @param date - Date to filter by
 * @returns Filtered events for the specified date
 */
export function getEventsForDate(events: ProjectEvent[], date: Date | undefined): ProjectEvent[] {
  if (!date || !events.length) return [];
  
  const dateString = date.toISOString().split('T')[0];
  return events.filter((event: ProjectEvent) => {
    const eventDate = new Date(event.date);
    return eventDate.toISOString().split('T')[0] === dateString;
  });
}

/**
 * Check if a date is a weekend (Saturday or Sunday)
 * @param date - The date to check
 * @returns Boolean indicating if date is a weekend
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
}

/**
 * Determine the effective crochet time for a date based on its availability
 * @param date - The date to check
 * @param availability - Availability status of the date
 * @param dailyCrochetTime - Default daily crochet time in minutes
 * @returns Available crochet time in minutes
 */
export function getEffectiveCrochetTime(
  date: Date, 
  availability: 'blocked' | 'half' | 'full',
  dailyCrochetTime: number
): number {
  switch (availability) {
    case 'full':
      return dailyCrochetTime;
    case 'half':
      return Math.floor(dailyCrochetTime / 2);
    case 'blocked':
      return 0;
    default:
      return dailyCrochetTime;
  }
}