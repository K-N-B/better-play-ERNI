// src/utils/timeFormat.ts
export function formatTimeAgo(isoTimestamp: string): string {
  const now = new Date();
  const past = new Date(isoTimestamp);
  const diffMs = now.getTime() - past.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Just now (< 1 minute)
  if (diffMinutes < 1) {
    return 'Just now';
  }

  // Minutes ago (< 60 minutes)
  if (diffMinutes < 60) {
    return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
  }

  // Hours ago (< 24 hours)
  if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }

  // Yesterday
  if (diffDays === 1) {
    return 'Yesterday';
  }

  // Days ago (< 7 days)
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  // Absolute date for older items
  return past.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: past.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}