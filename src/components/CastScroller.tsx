"use client";
import { useRef } from "react";
import Image from "next/image";
import { profileUrl } from "@/lib/images";
import type { CastMember } from "@/lib/types";

interface Props {
  cast: CastMember[];
  title?: string;
}

export function CastScroller({ cast, title = "Cast" }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scroll(dir: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  }

  if (cast.length === 0) return null;
  return (
    <section className="-mx-4 sm:-mx-6 group/cast">
      <div className="flex items-center justify-between px-4 sm:px-6 mb-3">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <div className="hidden md:flex gap-1 opacity-0 group-hover/cast:opacity-100 transition-opacity">
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
        className="no-scrollbar flex gap-3 overflow-x-auto px-4 sm:px-6 pb-2 scroll-smooth"
      >
        {cast.map((c) => {
          const img = profileUrl(c.profilePath, "w185");
          return (
            <div key={c.id} className="flex-shrink-0 w-28 sm:w-32">
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)]">
                {img ? (
                  <Image
                    src={img}
                    alt={c.name}
                    fill
                    sizes="128px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-[var(--color-text-muted)] p-2 text-center">
                    {c.name}
                  </div>
                )}
              </div>
              <p className="text-sm font-medium text-white mt-2 line-clamp-1">
                {c.name}
              </p>
              {c.character && (
                <p className="text-xs text-[var(--color-text-muted)] line-clamp-1">
                  {c.character}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
