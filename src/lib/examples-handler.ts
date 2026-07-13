// Marka örnek kartları — public uçlar.
//  GET /api/examples  → admin'in eklediği örnek kartların listesi (D1 + R2 URL).
//  GET /assets/<key>  → R2'deki görseli servis eder (bucket public değil, worker üzerinden).

type D1Result = { results?: Record<string, unknown>[] };
type D1Stmt = { bind: (...a: unknown[]) => D1Stmt; all: () => Promise<D1Result> };
type D1Database = { prepare: (q: string) => D1Stmt };
type R2ObjectBody = {
  body: ReadableStream;
  httpMetadata?: { contentType?: string };
  writeHttpMetadata?: (h: Headers) => void;
} | null;
type R2Bucket = { get: (key: string) => Promise<R2ObjectBody> };
type ExamplesEnv = { DB?: D1Database; BUCKET?: R2Bucket };

export type ExampleRow = {
  id: string;
  title: string;
  description: string;
  color_tag: string;
  image_url: string;
};

function json(data: unknown, status = 200, cache = 60): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": `public, max-age=${cache}`,
    },
  });
}

/** GET /api/examples — public liste. */
export async function handlePublicExamples(_request: Request, env: ExamplesEnv): Promise<Response> {
  if (!env.DB) return json({ examples: [] });
  try {
    const { results } = await env.DB.prepare(
      "SELECT id, title, description, color_tag, image_key FROM examples ORDER BY sort_order ASC, created_at DESC",
    ).all();
    const examples: ExampleRow[] = (results ?? []).map((r) => ({
      id: String(r.id),
      title: String(r.title ?? ""),
      description: String(r.description ?? ""),
      color_tag: String(r.color_tag ?? ""),
      image_url: `/assets/${r.image_key}`,
    }));
    return json({ examples });
  } catch {
    return json({ examples: [] });
  }
}

/** GET /assets/<key> — R2 görselini servis et. */
export async function serveAsset(request: Request, env: ExamplesEnv): Promise<Response> {
  const url = new URL(request.url);
  const key = decodeURIComponent(url.pathname.replace(/^\/assets\//, ""));
  if (!key || !env.BUCKET) return new Response("Not found", { status: 404 });
  const obj = await env.BUCKET.get(key);
  if (!obj) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  headers.set("cache-control", "public, max-age=31536000, immutable");
  headers.set("content-type", obj.httpMetadata?.contentType || "application/octet-stream");
  return new Response(obj.body, { headers });
}
