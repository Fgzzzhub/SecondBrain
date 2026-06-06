import { format } from 'date-fns'

/**
 * Groups an array of objects by a formatted date string (YYYY-MM-DD).
 * @param items Array of objects to group.
 * @param getDateKey Function to extract the date field from an object.
 */
export function groupByDate<T>(
  items: T[],
  getDateKey: (item: T) => string | Date
): Record<string, T[]> {
  return items.reduce((groups, item) => {
    try {
      const dateVal = getDateKey(item)
      const dateStr = format(new Date(dateVal), 'yyyy-MM-dd')
      if (!groups[dateStr]) {
        groups[dateStr] = []
      }
      groups[dateStr].push(item)
    } catch (e) {
      console.error('Error grouping item by date:', e)
    }
    return groups
  }, {} as Record<string, T[]>)
}
