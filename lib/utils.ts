import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to sort timeline events
export const sortTimelineEvents = (events: any[]) => {
  return events.sort((a, b) => {
    // Try to parse dates for sorting
    const dateA = new Date(a.approximateDate);
    const dateB = new Date(b.approximateDate);
    
    // If both are valid dates, sort by date
    if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
      return dateA.getTime() - dateB.getTime();
    }
    
    // If only one is a valid date, put valid dates first
    if (!isNaN(dateA.getTime()) && isNaN(dateB.getTime())) {
      return -1;
    }
    if (isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
      return 1;
    }
    
    // If neither is a valid date, sort alphabetically
    return a.approximateDate.localeCompare(b.approximateDate);
  });
};