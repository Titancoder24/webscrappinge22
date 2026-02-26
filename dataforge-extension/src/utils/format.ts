/**
 * Formatting utilities for numbers, dates, durations, and text.
 */

/**
 * Format a number with locale-aware thousands separators.
 *
 * @param value - The number to format
 * @param locale - BCP 47 locale string (default 'en-US')
 * @returns Formatted string, e.g. "1,234" or "1,234.56"
 */
export function formatNumber(value: number, locale: string = 'en-US'): string {
  if (!Number.isFinite(value)) return String(value);
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Format a duration in seconds into a human-readable string.
 *
 * @param seconds - Duration in seconds
 * @returns Formatted duration, e.g. "1m 23s", "2h 5m", "< 1s"
 */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0s';

  if (seconds < 1) return '< 1s';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

/**
 * Format a byte count into a human-readable file size.
 *
 * @param bytes - Size in bytes
 * @param decimals - Number of decimal places (default 1)
 * @returns Formatted size, e.g. "1.2 MB", "512 B"
 */
export function formatFileSize(bytes: number, decimals: number = 1): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
  const value = bytes / Math.pow(k, i);

  // No decimals for bytes
  if (i === 0) return `${Math.round(value)} B`;

  return `${value.toFixed(decimals)} ${units[i]}`;
}

/**
 * Format a Unix timestamp (ms) into a readable date string.
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @param options - Intl.DateTimeFormat options or a preset name
 * @returns Formatted date string
 */
export function formatDate(
  timestamp: number,
  options: Intl.DateTimeFormatOptions | 'short' | 'long' | 'relative' = 'short',
): string {
  if (!Number.isFinite(timestamp)) return 'Invalid date';

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Invalid date';

  if (options === 'relative') {
    return formatRelativeTime(date);
  }

  const presets: Record<string, Intl.DateTimeFormatOptions> = {
    short: { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
    long: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    },
  };

  const formatOptions = typeof options === 'string' ? presets[options] : options;
  return new Intl.DateTimeFormat('en-US', formatOptions).format(date);
}

/**
 * Format a date as a relative time string (e.g. "2 hours ago", "just now").
 */
function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay}d ago`;

  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}mo ago`;

  const diffYear = Math.floor(diffMonth / 12);
  return `${diffYear}y ago`;
}

/**
 * Truncate text to a maximum length, appending an ellipsis if truncated.
 *
 * @param text - The text to truncate
 * @param maxLength - Maximum character length (default 100)
 * @param suffix - Suffix to append when truncated (default "...")
 * @returns Truncated string
 */
export function truncateText(text: string, maxLength: number = 100, suffix: string = '...'): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  // Ensure we don't exceed maxLength including the suffix
  const truncateAt = Math.max(0, maxLength - suffix.length);
  return text.slice(0, truncateAt) + suffix;
}
