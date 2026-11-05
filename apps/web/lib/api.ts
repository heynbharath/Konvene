export class ApiError extends Error {
  status: number;
  data: any;
  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

function getTargetUrl(path: string): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  // If in browser on Vercel or any non-localhost production domain
  if (typeof window !== "undefined") {
    const isLive =
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1";

    if (isLive) {
      // If user specified an explicit HTTPS production URL, use that
      if (envUrl && envUrl.startsWith("https://")) {
        return `${envUrl.replace(/\/$/, "")}${cleanPath}`;
      }
      // Otherwise, use self-hosted Next.js /api route on the current origin
      return `/api${cleanPath}`;
    }
  }

  // Local development
  const base = envUrl || "http://localhost:4000";
  return `${base.replace(/\/$/, "")}${cleanPath}`;
}

export async function api<T = any>(
  path: string,
  opts: { method?: string; body?: unknown; token?: string | null } = {}
): Promise<T> {
  const targetUrl = getTargetUrl(path);

  let res: Response;
  try {
    res = await fetch(targetUrl, {
      method: opts.method ?? "GET",
      headers: {
        "content-type": "application/json",
        ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      cache: "no-store",
    });
  } catch (err: any) {
    // If targetUrl failed (e.g. localhost:4000 unreachable or mixed content on Vercel), fallback to self-hosted Next.js /api
    if (!targetUrl.startsWith("/api") && typeof window !== "undefined") {
      const cleanPath = path.startsWith("/") ? path : `/${path}`;
      res = await fetch(`/api${cleanPath}`, {
        method: opts.method ?? "GET",
        headers: {
          "content-type": "application/json",
          ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}),
        },
        body: opts.body ? JSON.stringify(opts.body) : undefined,
        cache: "no-store",
      });
    } else {
      throw err;
    }
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message =
      typeof data?.error === "string"
        ? data.error
        : data?.error
        ? JSON.stringify(data.error)
        : res.statusText;
    throw new ApiError(res.status, message, data);
  }
  return data as T;
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
