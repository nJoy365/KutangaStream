import Link from "next/link";
import type { MediaType } from "@/lib/types";

// Color tiers — green for kid-safe, red for adult, yellow/orange in between.
function styleFor(code: string): string {
  if (["G", "TV-Y", "TV-Y7", "TV-G"].includes(code)) {
    return "border-emerald-600/60 text-emerald-400";
  }
  if (["PG", "TV-PG"].includes(code)) {
    return "border-yellow-600/60 text-yellow-400";
  }
  if (["PG-13", "TV-14"].includes(code)) {
    return "border-orange-600/60 text-orange-400";
  }
  if (["R", "TV-MA"].includes(code)) {
    return "border-rose-600/70 text-rose-400";
  }
  if (code === "NC-17") {
    return "border-red-700/80 text-red-500";
  }
  return "border-[var(--color-border)] text-[var(--color-text-muted)]";
}

interface Props {
  code: string;
  type: MediaType;
  /** Skip the link wrapper — use for places that aren't navigable. */
  asLink?: boolean;
}

export function RatingBadge({ code, type, asLink = true }: Props) {
  const cls = `px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded border ${styleFor(code)}`;
  if (!asLink) return <span className={cls}>{code}</span>;
  return (
    <Link
      href={`/rating/${encodeURIComponent(code)}?type=${type}`}
      className={`${cls} hover:bg-[var(--color-surface)] transition-colors`}
      title={`Browse ${code} ${type === "movie" ? "movies" : "TV"}`}
    >
      {code}
    </Link>
  );
}
