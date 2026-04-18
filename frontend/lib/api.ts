export type Campaign = {
  id: number;
  tenant_id: number;
  code: string;
  name: string;
  key_visual_url?: string | null;
  key_text?: string | null;
  products_json: string;
  thank_you_message?: string | null;
  landing_url?: string | null;
  no_landing_end_message?: string | null;
  lp_background_key?: string;
  lp_intro_title?: string | null;
  lp_intro_image_url?: string | null;
  lp_intro_text?: string | null;
  vote_max_products?: number;
  created_at: string;
  updated_at: string;
};

function baseUrl(): string {
  // Server-side (Node in container) must use docker network.
  if (typeof window === "undefined") {
    return process.env.API_INTERNAL_BASE_URL ?? "http://backend:8000";
  }
  // Client-side uses host-mapped URL.
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001";
}

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: "POST",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}

export async function apiPatch<T>(
  path: string,
  body: unknown,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: "PATCH",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}

export async function apiDelete<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: "DELETE",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}

