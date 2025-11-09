import { type ClassValue, clsx } from "clsx";

/**
 * Utility function to merge class names
 * Combines clsx for conditional classes with a simple merge for conflicts
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
