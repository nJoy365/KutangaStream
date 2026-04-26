interface Props {
  src: string;
  title?: string;
}

export function Player({ src, title }: Props) {
  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-[var(--color-border)]">
      <iframe
        src={src}
        title={title ?? "Player"}
        className="absolute inset-0 w-full h-full"
        // Permissions need wildcards because vsembed loads the actual video
        // from third-party origins inside its own iframe — without `*`, the
        // fullscreen request from the inner player gets blocked by us.
        allow="autoplay *; fullscreen *; picture-in-picture *; encrypted-media *"
        allowFullScreen
        referrerPolicy="origin"
      />
    </div>
  );
}
