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
