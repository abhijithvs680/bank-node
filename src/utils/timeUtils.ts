/**
 * Parse various date formats into a Date object
 * Handles: MM/DD/YYYY HH:mm:ss, DD-MM-YYYY HH:mm:ss, ISO format, and standard date strings
 */
export const parseDateTime = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  
  // Handle MM/DD/YYYY HH:mm:ss format (e.g., "12/23/2025 11:23:19")
  if (dateStr.includes('/') && dateStr.includes(':') && !dateStr.includes('T')) {
    const [datePart, timePart] = dateStr.split(' ');
    if (datePart && timePart) {
      const [month, day, year] = datePart.split('/');
      if (day && month && year) {
        const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart}`);
        if (!isNaN(date.getTime())) return date;
      }
    }
  }
  
  // Handle DD-MM-YYYY HH:mm:ss format (e.g., "29-09-2025 12:49:38")
  if (dateStr.includes('-') && dateStr.includes(':') && !dateStr.includes('T')) {
    const [datePart, timePart] = dateStr.split(' ');
    if (datePart && timePart) {
      const [day, month, year] = datePart.split('-');
      if (day && month && year) {
        const date = new Date(`${year}-${month}-${day}T${timePart}`);
        if (!isNaN(date.getTime())) return date;
      }
    }
  }
  
  // Handle MM/DD/YYYY format without time (e.g., "12/23/2025")
  if (dateStr.includes('/') && !dateStr.includes(':')) {
    const [month, day, year] = dateStr.split('/');
    if (day && month && year) {
      const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      if (!isNaN(date.getTime())) return date;
    }
  }
  
  // Standard date parsing (ISO format, etc.)
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
};

/** Format a Date as MM/DD/YYYY for API payloads (e.g. ScheduledDate). */
export const formatDateForApi = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}/${date.getFullYear()}`;
};

/**
 * Get ordinal suffix for day (1st, 2nd, 3rd, 4th, etc.)
 */
const getOrdinalSuffix = (day: number): string => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

/**
 * Format date as "23rd December 2025, 11:23 PM"
 */
export const getFormattedDateTime = (dateStr: string): string => {
  const date = parseDateTime(dateStr);
  if (!date) return 'Unknown';
  
  const day = date.getDate();
  const ordinal = getOrdinalSuffix(day);
  
  const month = date.toLocaleString('en-US', { month: 'long' });
  const year = date.getFullYear();
  const time = date.toLocaleString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });
  
  return `${day}${ordinal} ${month} ${year}, ${time}`;
};

/**
 * Format date as "23rd December 2025" (without time)
 */
export const getFormattedDate = (dateStr: string): string => {
  const date = parseDateTime(dateStr);
  if (!date) return 'Unknown';
  
  const day = date.getDate();
  const ordinal = getOrdinalSuffix(day);
  
  const month = date.toLocaleString('en-US', { month: 'long' });
  const year = date.getFullYear();
  
  return `${day}${ordinal} ${month} ${year}`;
};

/**
 * Format relative time (hours, days, weeks, months)
 * - Less than 24 hours: show in hours
 * - 24 hours to 7 days: show in days
 * - 7 days to 30 days: show in weeks
 * - More than 30 days: show in months
 */
export const getRelativeTime = (dateStr: string): string => {
  const date = parseDateTime(dateStr);
  if (!date) return 'Unknown';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  // Handle future dates
  if (diffMs < 0) return 'Just now';
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  
  // Less than 1 hour
  if (diffMinutes < 60) {
    if (diffMinutes < 1) return 'Just now';
    return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
  }
  
  // Less than 24 hours → show hours
  if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }
  
  // 24 hours to 7 days → show days
  if (diffDays < 7) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  }
  
  // 7 days to 30 days → show weeks
  if (diffWeeks < 4) {
    return diffWeeks === 1 ? '1 week ago' : `${diffWeeks} weeks ago`;
  }
  
  // More than 30 days → show months
  return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
};

/**
 * Get exact date and time with ordinal format for tooltip display
 * Returns format: "23rd December 2025, 11:23 PM"
 */
export const getExactDateTime = (dateStr: string): string => {
  return getFormattedDateTime(dateStr);
};

/**
 * Format relative time for future dates (medication due times)
 * - Shows "in X hours/days/weeks/months" for future dates
 * - Shows "X hours/days/weeks/months overdue" for past dates
 */
export const getRelativeTimeFuture = (dateStr: string): { text: string; isOverdue: boolean } => {
  const date = parseDateTime(dateStr);
  if (!date) return { text: 'Unknown', isOverdue: false };
  
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const isOverdue = diffMs < 0;
  const absDiffMs = Math.abs(diffMs);
  
  const diffMinutes = Math.floor(absDiffMs / (1000 * 60));
  const diffHours = Math.floor(absDiffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  
  let timeText = '';
  
  // Less than 1 hour
  if (diffMinutes < 60) {
    if (diffMinutes < 1) {
      timeText = isOverdue ? 'just now' : 'now';
    } else {
      timeText = diffMinutes === 1 ? '1 minute' : `${diffMinutes} minutes`;
    }
  }
  // Less than 24 hours → show hours
  else if (diffHours < 24) {
    timeText = diffHours === 1 ? '1 hour' : `${diffHours} hours`;
  }
  // 24 hours to 7 days → show days
  else if (diffDays < 7) {
    timeText = diffDays === 1 ? '1 day' : `${diffDays} days`;
  }
  // 7 days to 30 days → show weeks
  else if (diffWeeks < 4) {
    timeText = diffWeeks === 1 ? '1 week' : `${diffWeeks} weeks`;
  }
  // More than 30 days → show months
  else {
    timeText = diffMonths === 1 ? '1 month' : `${diffMonths} months`;
  }
  
  const text = isOverdue ? `${timeText} overdue` : `in ${timeText}`;
  return { text, isOverdue };
};
