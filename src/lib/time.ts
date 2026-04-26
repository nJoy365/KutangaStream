const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function relativeTime(ts: number, now = Date.now()): string {
  const diffMs = ts - now;
  const diffSec = Math.round(diffMs / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return rtf.format(diffSec, "second");
  if (abs < 60 * 60) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs < 60 * 60 * 24) return rtf.format(Math.round(diffSec / 3600), "hour");
  if (abs < 60 * 60 * 24 * 7)
    return rtf.format(Math.round(diffSec / (3600 * 24)), "day");
  if (abs < 60 * 60 * 24 * 30)
    return rtf.format(Math.round(diffSec / (3600 * 24 * 7)), "week");
  if (abs < 60 * 60 * 24 * 365)
    return rtf.format(Math.round(diffSec / (3600 * 24 * 30)), "month");
  return rtf.format(Math.round(diffSec / (3600 * 24 * 365)), "year");
}

export function absoluteTime(ts: number): string {
  return new Date(ts).toLocaleString();
}

/**
 * Returns true if a YYYY-MM-DD date string is within the last `days` days
 * (default 90). Future dates and invalid input return false.
 */
export function isNew(dateStr: string | null | undefined, days = 90): boolean {
  if (!dateStr) return false;
  const t = Date.parse(dateStr);
  if (Number.isNaN(t)) return false;
  const now = Date.now();
  if (t > now) return false; // future release
  return now - t <= days * 24 * 60 * 60 * 1000;
}
