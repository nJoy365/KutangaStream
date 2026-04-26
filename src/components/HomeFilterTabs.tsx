import Link from "next/link";

export type HomeFilter = "all" | "movie" | "tv";

interface Props {
  current: HomeFilter;
}

const TABS: { id: HomeFilter; label: string; href: string }[] = [
  { id: "all", label: "All", href: "/" },
  { id: "movie", label: "Movies", href: "/?type=movie" },
  { id: "tv", label: "TV Shows", href: "/?type=tv" },
];

export function HomeFilterTabs({ current }: Props) {
  return (
    <div className="px-4 sm:px-6 mb-6 flex gap-2">
      {TABS.map((t) => {
        const active = t.id === current;
        return (
          <Link
            key={t.id}
            href={t.href}
            className={`px-4 h-9 inline-flex items-center rounded-full text-sm font-medium border transition-colors ${
              active
                ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-white"
                : "bg-[var(--color-surface)] border-[var(--color-border)] text-zinc-300 hover:border-[var(--color-accent)] hover:text-white"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
