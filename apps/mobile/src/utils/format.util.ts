import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import advancedFormat from 'dayjs/plugin/advancedFormat';

dayjs.extend(relativeTime);
dayjs.extend(advancedFormat);

/**
 * Format large numbers to abbreviated form: 1200 -> "1.2K", 1500000 -> "1.5M"
 */
export const formatNumber = (value: number): string => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return value.toString();
};

/**
 * Format a percentage value with 1 decimal place: 12.345 -> "12.3%"
 */
export const formatPercentage = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format a date string relative to now: "2 hours ago", "in 3 days"
 */
export const formatRelativeDate = (date: string): string => {
  return dayjs(date).fromNow();
};

/**
 * Format a date to a human-readable label: "Apr 4, 2026"
 */
export const formatDate = (date: string, format = 'MMM D, YYYY'): string => {
  return dayjs(date).format(format);
};

/**
 * Format a datetime: "Apr 4, 2026 at 3:00 PM"
 */
export const formatDateTime = (date: string): string => {
  return dayjs(date).format('MMM D, YYYY [at] h:mm A');
};

/**
 * Format a scheduled date: "Today at 3:00 PM" / "Tomorrow at 10:00 AM"
 */
export const formatScheduled = (date: string): string => {
  const d = dayjs(date);
  const today = dayjs();
  const tomorrow = today.add(1, 'day');

  if (d.isSame(today, 'day')) {
    return `Today at ${d.format('h:mm A')}`;
  }
  if (d.isSame(tomorrow, 'day')) {
    return `Tomorrow at ${d.format('h:mm A')}`;
  }
  return d.format('MMM D [at] h:mm A');
};

/**
 * Format currency in USD: 2900 cents -> "$29.00"
 */
export const formatCurrency = (cents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(cents);
};

/**
 * Truncate text to a maximum length with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength - 3)}...`;
};

/**
 * Capitalize first letter of a string
 */
export const capitalize = (text: string): string => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/**
 * Get initials from a name: "John Doe" -> "JD"
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};
