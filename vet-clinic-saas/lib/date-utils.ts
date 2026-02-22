/**
 * Date formatting utilities for consistent date display across the app
 */

/**
 * Format date as "MM/DD/YYYY"
 */
export function formatDate(dateString: string | Date | null): string {
  if (!dateString) return "N/A";
  
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  
  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

/**
 * Format date as "Jan 15, 2024"
 */
export function formatDateLong(dateString: string | Date | null): string {
  if (!dateString) return "N/A";
  
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format date as "Jan 15"
 */
export function formatDateShort(dateString: string | Date | null): string {
  if (!dateString) return "N/A";
  
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Format time from 24h to 12h format (e.g., "14:30" -> "2:30 PM")
 */
export function formatTime(time: string): string {
  if (!time) return "N/A";
  
  const [hour, minute] = time.split(":");
  const h = parseInt(hour);
  const period = h >= 12 ? "PM" : "AM";
  const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  
  return `${displayHour}:${minute} ${period}`;
}

/**
 * Format datetime relative to now (e.g., "2 hours ago", "Yesterday")
 */
export function formatRelativeTime(dateString: string | Date): string {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return formatDateLong(date);
}

/**
 * Get ISO date string for input[type="date"] (YYYY-MM-DD)
 */
export function toInputDate(date: Date | string | null): string {
  if (!date) return "";
  
  const d = typeof date === "string" ? new Date(date) : date;
  
  return d.toISOString().split("T")[0];
}

/**
 * Get today's date as ISO string for min date on inputs
 */
export function getTodayISO(): string {
  return new Date().toISOString().split("T")[0];
}