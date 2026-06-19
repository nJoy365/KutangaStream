interface Props {
  /** Watch progress, 0–1. */
  fraction: number;
}

/**
 * Thin "resume" bar pinned to the bottom of a thumbnail/poster. Renders
 * nothing for barely-started (<2%) or essentially-finished (>95%) progress.
 * The parent must be `position: relative`.
 */
export function ProgressBar({ fraction }: Props) {
  if (fraction <= 0.02 || fraction >= 0.95) return null;
  return (
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60">
      <div
        className="h-full bg-[var(--color-accent)]"
        style={{ width: `${Math.round(fraction * 100)}%` }}
      />
    </div>
  );
}
