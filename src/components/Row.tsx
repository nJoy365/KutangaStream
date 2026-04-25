"use client";
import { useRef } from "react";
import { PosterCard } from "./PosterCard";
import type { MediaSummary } from "@/lib/types";

interface Props {
  title: string;
  items: MediaSummary[];
  emptyMessage?: string;
}

export function Row({ title, items, emptyMessage }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scroll(dir: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  }

  if (items.length === 0) {
    if (!emptyMessage) return null;
    return (
      <section className="px-6 mb-10">
        <h2 className="text-xl font-bold mb-3 text-white">{title}</h2>
        <p className="text-sm text-[var(--color-text-muted)]">{emptyMessage}</p>
      </section>
    );
  }

  return (
    <section className="mb-10 group/row">
      <div className="flex items-center justify-between px-6 mb-3">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <div className="hidden md:flex gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => scroll(-1)}
            className="w-8 h-8 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)] text-white flex items-center justify-center transition-colors"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => scroll(1)}
            className="w-8 h-8 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)] text-white flex items-center justify-center transition-colors"
          >
            ›
          </button>
        </div>
      </div>
      <div
        ref={scrollerRef}
        className="no-scrollbar flex gap-3 overflow-x-auto px-6 pb-2 scroll-smooth"
      >
        {items.map((m, i) => (
          <PosterCard key={`${m.type}-${m.id}`} media={m} priority={i < 6} />
        ))}
      </div>
    </section>
  );
}
