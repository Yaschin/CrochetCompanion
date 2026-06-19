/**
 * Date utility functions for consistent date handling across the application
 */

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
