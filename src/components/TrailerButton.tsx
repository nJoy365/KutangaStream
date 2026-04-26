"use client";
import { useEffect, useState } from "react";

interface Props {
  youtubeKey: string;
  title: string;
}

export function TrailerButton({ youtubeKey, title }: Props) {
  const [open, setOpen] = useState(false);

  // Esc closes the modal.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 h-10 rounded-md text-sm font-medium border border-[var(--color-border)] bg-[var(--color-surface)] text-white hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition-colors"
      >
        <span aria-hidden>▶</span>
        Watch Trailer
      </button>
      {open && (
        <div
          role="dialog"
          aria-label={`${title} trailer`}
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl aspect-video rounded-lg overflow-hidden bg-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={`https://www.youtube.com/embed/${youtubeKey}?autoplay=1&rel=0`}
              title={`${title} trailer`}
              allow="autoplay *; encrypted-media *; fullscreen *; picture-in-picture *"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close trailer"
              className="absolute top-2 right-2 w-9 h-9 rounded-full bg-black/60 text-white text-xl leading-none hover:bg-black/85 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}
