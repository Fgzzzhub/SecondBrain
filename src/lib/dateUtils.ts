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

/**
 * Calculates the UTC ISO strings representing the start and end of the day
 * for a specific timezone (e.g. 'Asia/Jakarta').
 */
export function getLocalDayBounds(timeZone: string = 'UTC') {
  try {
    const now = new Date()
    
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    })
    const parts = formatter.formatToParts(now)
    const partMap = Object.fromEntries(parts.map(p => [p.type, p.value]))
    const year = parseInt(partMap.year)
    const month = parseInt(partMap.month) - 1
    const day = parseInt(partMap.day)

    const getUTCForTime = (h: number, m: number, s: number, ms: number) => {
      const utcDate = new Date(Date.UTC(year, month, day, h, m, s, ms))
      
      const tzFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        fractionalSecondDigits: 3,
        hour12: false
      })
      
      const tzParts = tzFormatter.formatToParts(utcDate)
      const tzPartMap = Object.fromEntries(tzParts.map(p => [p.type, p.value]))
      
      let hour = parseInt(tzPartMap.hour)
      if (hour === 24) hour = 0
      
      const tzDateUTC = Date.UTC(
        parseInt(tzPartMap.year),
        parseInt(tzPartMap.month) - 1,
        parseInt(tzPartMap.day),
        hour,
        parseInt(tzPartMap.minute),
        parseInt(tzPartMap.second),
        parseInt(tzPartMap.fractionalSecond)
      )
      
      const offsetMs = tzDateUTC - utcDate.getTime()
      return new Date(utcDate.getTime() - offsetMs)
    }

    const startOfToday = getUTCForTime(0, 0, 0, 0)
    const endOfToday = getUTCForTime(23, 59, 59, 999)

    return {
      startOfTodayStr: startOfToday.toISOString(),
      endOfTodayStr: endOfToday.toISOString()
    }
  } catch (err) {
    console.error('Error calculating day bounds in timezone:', timeZone, err)
    // Fallback to local machine/server time
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const endOfToday = new Date()
    endOfToday.setHours(23, 59, 59, 999)
    return {
      startOfTodayStr: startOfToday.toISOString(),
      endOfTodayStr: endOfToday.toISOString()
    }
  }
}

