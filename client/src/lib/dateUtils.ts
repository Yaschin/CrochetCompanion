/**
 * Date utility functions for consistent date handling across the application
 */

/**
 * Formats a date to YYYY-MM-DD format for input fields and API requests
 * @param date - The date to format
 * @returns Formatted date string in YYYY-MM-DD format
 */
export function formatDateForInput(date: Date | string | undefined): string {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toISOString().split('T')[0];
}

/**
 * Formats a date for display to users with localization options
 * @param date - The date to format
 * @param options - Intl.DateTimeFormatOptions for controlling format
 * @returns Formatted date string for display
 */
export function formatDateForDisplay(
  date: Date | string | undefined, 
  options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }
): string {
  if (!date) return 'No date';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleDateString('en-US', options);
}

/**
 * Adds days to a date
 * @param date - The starting date
 * @param days - Number of days to add (can be negative)
 * @returns New date with days added
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Checks if a date is a weekend (Saturday or Sunday)
 * @param date - The date to check
 * @returns Boolean indicating if date is a weekend
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
}

/**
 * Checks if two dates are the same calendar day
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Boolean indicating if dates are the same day
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = date1 instanceof Date ? date1 : new Date(date1);
  const d2 = date2 instanceof Date ? date2 : new Date(date2);
  
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Formats a time duration in minutes to a human-readable format
 * @param minutes - Duration in minutes
 * @returns Formatted time string (e.g., "2 hours 30 minutes")
 */
export function formatTimeEstimate(minutes: number): string {
  if (!minutes || minutes <= 0) return "0 minutes";
  
  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }
  
  return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${remainingMinutes} ${remainingMinutes === 1 ? 'minute' : 'minutes'}`;
}

/**
 * Gets the ordinal suffix for a number (e.g., 1st, 2nd, 3rd, 4th)
 * @param num - The number to get the ordinal suffix for
 * @returns The ordinal suffix string
 */
export function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;
  
  if (j === 1 && k !== 11) {
    return "st";
  }
  if (j === 2 && k !== 12) {
    return "nd";
  }
  if (j === 3 && k !== 13) {
    return "rd";
  }
  return "th";
}