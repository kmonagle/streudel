import { RRule, Weekday } from 'rrule';

export interface RecurrenceParseResult {
  rrule: string;
  nextOccurrence: Date;
  description: string;
}

/**
 * Parse natural language recurrence patterns into RRULE format
 * Examples:
 * - "every thursday" → Weekly on Thursday
 * - "every 2 weeks" → Every 2 weeks from today
 * - "2nd monday of each month" → Monthly on 2nd Monday
 * - "15th of every month" → Monthly on 15th
 */
export function parseRecurrence(input: string): RecurrenceParseResult | null {
  const normalized = input.toLowerCase().trim();

  // Every [day of week]
  const everyDayMatch = normalized.match(/^every\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/);
  if (everyDayMatch) {
    const dayName = everyDayMatch[1];
    const weekday = getWeekday(dayName);
    const rule = new RRule({
      freq: RRule.WEEKLY,
      byweekday: [weekday],
    });
    const next = rule.after(new Date(), true);

    // Get RRULE string - toString() returns full format, we need just the RRULE part
    const rruleStr = rule.toString();
    const rruleLine = rruleStr.includes('\n') ? rruleStr.split('\n').find(line => line.startsWith('RRULE:')) : rruleStr;

    return {
      rrule: rruleLine || rule.toString(),
      nextOccurrence: next,
      description: `Every ${capitalize(dayName)}`,
    };
  }

  // Every N weeks (on the same day as today)
  const everyNWeeksMatch = normalized.match(/^every\s+(\d+)\s+weeks?$/);
  if (everyNWeeksMatch) {
    const interval = parseInt(everyNWeeksMatch[1]);
    const today = new Date();
    const weekday = getWeekdayFromDate(today);
    const rule = new RRule({
      freq: RRule.WEEKLY,
      interval: interval,
      byweekday: [weekday],
    });
    const next = rule.after(new Date(), true);

    const rruleStr = rule.toString();
    const rruleLine = rruleStr.includes('\n') ? rruleStr.split('\n').find(line => line.startsWith('RRULE:')) : rruleStr;

    return {
      rrule: rruleLine || rule.toString(),
      nextOccurrence: next,
      description: `Every ${interval} week${interval > 1 ? 's' : ''} on ${getDayName(today.getDay())}`,
    };
  }

  // Nth [day] of each month (e.g., "2nd monday of each month")
  const nthDayMatch = normalized.match(/^(\d+)(st|nd|rd|th)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+of\s+(?:each|every)\s+month$/);
  if (nthDayMatch) {
    const nth = parseInt(nthDayMatch[1]);
    const dayName = nthDayMatch[3];
    const weekday = getWeekday(dayName);

    // RRULE uses +1MO for 1st Monday, +2MO for 2nd Monday, etc.
    const rule = new RRule({
      freq: RRule.MONTHLY,
      byweekday: [weekday.nth(nth)],
    });
    const next = rule.after(new Date(), true);

    const rruleStr = rule.toString();
    const rruleLine = rruleStr.includes('\n') ? rruleStr.split('\n').find(line => line.startsWith('RRULE:')) : rruleStr;

    return {
      rrule: rruleLine || rule.toString(),
      nextOccurrence: next,
      description: `${nth}${getOrdinalSuffix(nth)} ${capitalize(dayName)} of each month`,
    };
  }

  // [N]th of every month (e.g., "15th of every month")
  const dayOfMonthMatch = normalized.match(/^(\d+)(st|nd|rd|th)\s+of\s+(?:each|every)\s+month$/);
  if (dayOfMonthMatch) {
    const day = parseInt(dayOfMonthMatch[1]);
    if (day < 1 || day > 31) return null;

    const rule = new RRule({
      freq: RRule.MONTHLY,
      bymonthday: [day],
    });
    const next = rule.after(new Date(), true);

    const rruleStr = rule.toString();
    const rruleLine = rruleStr.includes('\n') ? rruleStr.split('\n').find(line => line.startsWith('RRULE:')) : rruleStr;

    return {
      rrule: rruleLine || rule.toString(),
      nextOccurrence: next,
      description: `${day}${getOrdinalSuffix(day)} of each month`,
    };
  }

  // Every day
  if (normalized === 'every day' || normalized === 'daily') {
    const rule = new RRule({
      freq: RRule.DAILY,
    });
    const next = rule.after(new Date(), true);

    const rruleStr = rule.toString();
    const rruleLine = rruleStr.includes('\n') ? rruleStr.split('\n').find(line => line.startsWith('RRULE:')) : rruleStr;

    return {
      rrule: rruleLine || rule.toString(),
      nextOccurrence: next,
      description: 'Every day',
    };
  }

  // First and last [day] of month (e.g., "first and last friday")
  const firstLastMatch = normalized.match(/^first\s+and\s+last\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/);
  if (firstLastMatch) {
    const dayName = firstLastMatch[1];
    const weekday = getWeekday(dayName);
    const rule = new RRule({
      freq: RRule.MONTHLY,
      byweekday: [weekday.nth(1), weekday.nth(-1)],
    });
    const next = rule.after(new Date(), true);

    const rruleStr = rule.toString();
    const rruleLine = rruleStr.includes('\n') ? rruleStr.split('\n').find(line => line.startsWith('RRULE:')) : rruleStr;

    return {
      rrule: rruleLine || rule.toString(),
      nextOccurrence: next,
      description: `First and last ${capitalize(dayName)} of each month`,
    };
  }

  return null;
}

/**
 * Get human-readable description from RRULE string
 */
export function getRRuleDescription(rruleStr: string): string {
  try {
    const rule = RRule.fromString(rruleStr);
    return rule.toText();
  } catch (error) {
    return 'Custom recurrence';
  }
}

/**
 * Calculate next occurrence from RRULE string
 */
export function getNextOccurrence(rruleStr: string, afterDate: Date = new Date()): Date | null {
  try {
    const rule = RRule.fromString(rruleStr);
    return rule.after(afterDate, true);
  } catch (error) {
    console.error('Error calculating next occurrence:', error);
    return null;
  }
}

/**
 * Check if a date matches the recurrence pattern (is it due today?)
 */
export function isOccurrenceToday(nextOccurrence: Date | string): boolean {
  // Parse the date string and treat it as a calendar date (not a timestamp)
  const dateStr = typeof nextOccurrence === 'string' ? nextOccurrence : nextOccurrence.toISOString();
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);

  const today = new Date();

  return (
    year === today.getFullYear() &&
    month === today.getMonth() + 1 &&
    day === today.getDate()
  );
}

/**
 * Check if a recurring task is overdue
 */
export function isOverdue(nextOccurrence: Date | string): boolean {
  // Parse the date string and treat it as a calendar date (not a timestamp)
  const dateStr = typeof nextOccurrence === 'string' ? nextOccurrence : nextOccurrence.toISOString();
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);

  // Create a date in local timezone (not UTC)
  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return date < today;
}

/**
 * Format next occurrence date for display
 */
export function formatNextOccurrence(nextOccurrence: Date | string): string {
  // Parse the date string and treat it as a calendar date (not a timestamp)
  const dateStr = typeof nextOccurrence === 'string' ? nextOccurrence : nextOccurrence.toISOString();
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);

  // Create a date in local timezone (not UTC)
  const date = new Date(year, month - 1, day);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const occurrenceDay = new Date(date);
  occurrenceDay.setHours(0, 0, 0, 0);

  if (occurrenceDay.getTime() === today.getTime()) {
    return 'Today';
  } else if (occurrenceDay.getTime() === tomorrow.getTime()) {
    return 'Tomorrow';
  } else if (occurrenceDay < today) {
    const daysAgo = Math.floor((today.getTime() - occurrenceDay.getTime()) / (1000 * 60 * 60 * 24));
    return `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`;
  } else {
    // Future date
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  }
}

// Helper functions

function getWeekday(dayName: string): Weekday {
  const days: { [key: string]: Weekday } = {
    monday: RRule.MO,
    tuesday: RRule.TU,
    wednesday: RRule.WE,
    thursday: RRule.TH,
    friday: RRule.FR,
    saturday: RRule.SA,
    sunday: RRule.SU,
  };
  return days[dayName.toLowerCase()];
}

function getWeekdayFromDate(date: Date): Weekday {
  const dayIndex = date.getDay(); // 0 = Sunday, 6 = Saturday
  const weekdays = [RRule.SU, RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA];
  return weekdays[dayIndex];
}

function getDayName(dayIndex: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex];
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
