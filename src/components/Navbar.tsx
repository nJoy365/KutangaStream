import Link from "next/link";
import { Suspense } from "react";
import { SearchBar } from "./SearchBar";

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[var(--color-bg)]/85 backdrop-blur border-b border-[var(--color-border)]">
      <div className="mx-auto flex h-full max-w-7xl items-center gap-3 px-4 md:gap-6 md:px-6">
        <Link
          href="/"
          className="font-bold text-xl tracking-tight text-white hover:text-[var(--color-accent)] transition-colors"
        >
          <span className="text-[var(--color-accent)]">Kutanga</span>Stream
        </Link>
        <nav className="hidden md:flex items-center gap-5 text-sm text-[var(--color-text-muted)]">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <Link href="/watchlist" className="hover:text-white transition-colors">
            Watchlist
          </Link>
          <Link href="/favorites" className="hover:text-white transition-colors">
            Favorites
          </Link>
          <Link href="/history" className="hover:text-white transition-colors">
            History
          </Link>
        </nav>
        <div className="ml-auto w-full max-w-md min-w-0">
          <Suspense fallback={<div className="h-9" />}>
            <SearchBar />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
