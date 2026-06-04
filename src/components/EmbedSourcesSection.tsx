"use client";
import { useState } from "react";
import type { EmbedSourceConfig } from "@/lib/embedSources";
import { useEmbedSources } from "@/hooks/useEmbedSources";

const EMPTY_FORM: EmbedSourceConfig = {
  id: "",
  name: "",
  description: "",
  movieUrl: "",
  tvUrl: "",
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function SourceForm({
  initial,
  existingIds,
  onSave,
  onCancel,
}: {
  initial: EmbedSourceConfig;
  existingIds: string[];
  onSave: (s: EmbedSourceConfig) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial);
  const isNew = !existingIds.includes(initial.id) || initial.id === "";

  function set(field: keyof EmbedSourceConfig, val: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: val };
      if (isNew && field === "name") next.id = slugify(val);
      return next;
    });
  }

  function valid() {
    return (
      form.name.trim() !== "" &&
      form.movieUrl.trim() !== "" &&
      form.tvUrl.trim() !== "" &&
      form.id.trim() !== ""
    );
  }

  return (
    <div className="rounded-lg border border-[var(--color-accent)] bg-[var(--color-surface)] p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input label="Name" value={form.name} onChange={(v) => set("name", v)} placeholder="My Provider" />
        <Input label="Description (optional)" value={form.description ?? ""} onChange={(v) => set("description", v)} placeholder="Short note" />
      </div>
      <Input
        label="Movie URL"
        value={form.movieUrl}
        onChange={(v) => set("movieUrl", v)}
        placeholder="https://provider.example/embed/movie/{tmdb}"
        mono
      />
      <Input
        label="TV URL"
        value={form.tvUrl}
        onChange={(v) => set("tvUrl", v)}
        placeholder="https://provider.example/embed/tv/{tmdb}/{season}/{episode}"
        mono
      />
      <p className="text-xs text-[var(--color-text-muted)]">
        Placeholders: <code className="text-zinc-300">{"{tmdb}"}</code>{" "}
        <code className="text-zinc-300">{"{imdb}"}</code>{" "}
        <code className="text-zinc-300">{"{season}"}</code>{" "}
        <code className="text-zinc-300">{"{episode}"}</code>
      </p>
      <div className="flex gap-2 pt-1">
        <Btn onClick={() => valid() && onSave(form)} disabled={!valid()}>
          Save
        </Btn>
        <Btn variant="secondary" onClick={onCancel}>
          Cancel
        </Btn>
      </div>
    </div>
  );
}

export function EmbedSourcesSection() {
  const { sources, ready, add, update, remove, moveUp, moveDown } = useEmbedSources();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const existingIds = sources.map((s) => s.id);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Embed sources</h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Providers used on watch pages. The first source in the list is the default.
        </p>
      </div>

      {!ready ? (
        <div className="text-sm text-[var(--color-text-muted)]">Loading…</div>
      ) : sources.length === 0 && !showAdd ? (
        <p className="text-sm text-[var(--color-text-muted)]">
          No sources configured. Add one below.
        </p>
      ) : (
        <ul className="space-y-2">
          {sources.map((s, i) => (
            <li key={s.id}>
              {editingId === s.id ? (
                <SourceForm
                  initial={s}
                  existingIds={existingIds}
                  onSave={(updated) => {
                    update(s.id, updated);
                    setEditingId(null);
                  }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5">
                  <span className="flex-1 text-sm text-white font-medium truncate">
                    {s.name}
                    {s.description && (
                      <span className="ml-2 text-xs text-[var(--color-text-muted)] font-normal">
                        {s.description}
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <IconBtn onClick={() => moveUp(s.id)} disabled={i === 0} title="Move up">↑</IconBtn>
                    <IconBtn onClick={() => moveDown(s.id)} disabled={i === sources.length - 1} title="Move down">↓</IconBtn>
                    <Btn variant="secondary" onClick={() => { setShowAdd(false); setEditingId(s.id); }}>
                      Edit
                    </Btn>
                    <Btn variant="danger" onClick={() => remove(s.id)}>
                      Remove
                    </Btn>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {showAdd ? (
        <SourceForm
          initial={EMPTY_FORM}
          existingIds={existingIds}
          onSave={(s) => {
            add(s);
            setShowAdd(false);
          }}
          onCancel={() => setShowAdd(false)}
        />
      ) : (
        <Btn
          onClick={() => { setEditingId(null); setShowAdd(true); }}
          variant="secondary"
        >
          + Add source
        </Btn>
      )}
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-zinc-400">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`h-9 px-3 rounded-md bg-[var(--color-bg)] border border-[var(--color-border)] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--color-accent)] ${mono ? "font-mono text-xs" : ""}`}
      />
    </label>
  );
}

function Btn({
  children,
  onClick,
  variant = "primary",
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}) {
  const base = "px-3 h-8 inline-flex items-center justify-center rounded-md text-xs font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]"
      : variant === "danger"
        ? "bg-transparent border-rose-700 text-rose-400 hover:bg-rose-500/10"
        : "bg-[var(--color-surface)] border-[var(--color-border)] text-white hover:border-[var(--color-accent)]";
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

function IconBtn({
  children,
  onClick,
  disabled,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="w-7 h-7 inline-flex items-center justify-center rounded text-xs text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  );
}
