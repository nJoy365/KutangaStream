"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

interface ToastItem {
  id: number;
  message: string;
  variant: "default" | "success" | "error";
}

interface ToastContextValue {
  show: (message: string, variant?: ToastItem["variant"]) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // No-op fallback if rendered outside provider — keeps the API safe to call.
    return { show: () => {} };
  }
  return ctx;
}

let toastIdSeq = 0;
const TOAST_DURATION_MS = 2500;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  // One timer per toast so adding a new toast can't reset the dismiss
  // schedule of an older one.
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const show: ToastContextValue["show"] = useCallback((message, variant = "default") => {
    const id = ++toastIdSeq;
    setToasts((prev) => [...prev, { id, message, variant }]);
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timers.current.delete(id);
    }, TOAST_DURATION_MS);
    timers.current.set(id, timer);
  }, []);

  // Clean up any in-flight timers on unmount.
  useEffect(() => {
    const map = timers.current;
    return () => {
      for (const t of map.values()) clearTimeout(t);
      map.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        aria-live="polite"
        className="fixed left-1/2 -translate-x-1/2 bottom-24 md:bottom-6 z-[100] flex flex-col items-center gap-2 pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 h-10 inline-flex items-center rounded-full text-sm font-medium shadow-lg backdrop-blur fade-up ${
              t.variant === "success"
                ? "bg-emerald-600/90 text-white"
                : t.variant === "error"
                  ? "bg-rose-600/90 text-white"
                  : "bg-zinc-800/95 text-white border border-[var(--color-border)]"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
