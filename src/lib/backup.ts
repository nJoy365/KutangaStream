// Encode / decode helpers for backup files. The wire format is a small
// JSON envelope with a gzip+base64 inner payload — minimizes file size and
// gives the file a "looks like opaque blob" appearance vs raw user data.
//
// Round trip: JSON.stringify → gzip → base64 (text-safe) → wrap in envelope.

export interface BackupEnvelope {
  app: "KutangaStream";
  version: 2;
  exportedAt: string;
  encoding: "gzip+base64";
  data: string;
}

async function gzipString(s: string): Promise<Uint8Array> {
  const stream = new Blob([new TextEncoder().encode(s)]).stream();
  const compressed = stream.pipeThrough(new CompressionStream("gzip"));
  const buf = await new Response(compressed).arrayBuffer();
  return new Uint8Array(buf);
}

async function gunzipBytes(bytes: Uint8Array): Promise<string> {
  const stream = new Blob([new Uint8Array(bytes)]).stream();
  const decompressed = stream.pipeThrough(new DecompressionStream("gzip"));
  return await new Response(decompressed).text();
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  // Chunked to avoid String.fromCharCode call-stack limits on large payloads.
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Wrap arbitrary serializable state into the gzip+base64 envelope. */
export async function encodeBackup(payload: unknown): Promise<BackupEnvelope> {
  const json = JSON.stringify(payload);
  const compressed = await gzipString(json);
  return {
    app: "KutangaStream",
    version: 2,
    exportedAt: new Date().toISOString(),
    encoding: "gzip+base64",
    data: bytesToBase64(compressed),
  };
}

/** Decode an envelope back into the original payload object. */
export async function decodeBackup<T>(envelope: BackupEnvelope): Promise<T> {
  if (envelope.app !== "KutangaStream") {
    throw new Error("Not a KutangaStream backup.");
  }
  if (envelope.encoding !== "gzip+base64") {
    throw new Error(`Unknown encoding: ${envelope.encoding}`);
  }
  const bytes = base64ToBytes(envelope.data);
  const json = await gunzipBytes(bytes);
  return JSON.parse(json) as T;
}
