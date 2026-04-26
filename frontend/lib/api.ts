export type Tenant = {
  id: number;
  name: string;
  active: boolean;
  coupons_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type AuthMe = {
  id: number;
  email: string;
  role: string;
  tenant_id: number | null;
  /** テナント／ユーザ権限のときのみ。シスアドは null */
  tenant_coupons_enabled: boolean | null;
};

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
  vote_confirm_title?: string | null;
  vote_confirm_body?: string | null;
  email_required?: boolean;
  created_at: string;
  updated_at: string;
};

export type CampaignVoteResultItem = {
  index: number;
  vote_count: number;
  name: string;
  image_url: string | null;
};

export type CampaignVoteResults = {
  campaign_code: string;
  campaign_name: string;
  total_ballots: number;
  items: CampaignVoteResultItem[];
};

export type Coupon = {
  id: number;
  tenant_id: number;
  campaign_id?: number | null;
  name: string;
  image_url?: string | null;
  description?: string | null;
  /** 公開 LP 見出し（未設定時は COUPON_LP_DEFAULT_TITLE を表示） */
  lp_title?: string | null;
  created_at: string;
  updated_at: string;
};

/** 公開クーポン LP（トークン URL）用 */
export type PublicCouponIssue = {
  name: string;
  image_url?: string | null;
  description?: string | null;
  lp_title?: string | null;
  email: string;
  used: boolean;
  used_at?: string | null;
};

export type VoteSubmitResponse = {
  ok: boolean;
  thank_you_message?: string | null;
  coupon_tokens?: string[];
  /** 一部のゲートウェイ等で snake_case 以外で返る場合の保険 */
  couponTokens?: string[];
};

/** POST /campaigns/.../votes の 409（重複投票）用 */
export type VoteSubmitConflictResponse = {
  detail?: string;
  thank_you_message?: string | null;
  coupon_tokens?: string[];
  couponTokens?: string[];
};

export async function apiPostWithStatus<T>(
  path: string,
  body: unknown,
  init?: RequestInit,
): Promise<{ res: Response; data: T }> {
  const res = await fetch(apiUrl(path), {
    method: "POST",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data = {} as T;
  if (text) {
    try {
      data = JSON.parse(text) as T;
    } catch {
      data = {} as T;
    }
  }
  return { res, data };
}

function baseUrl(): string {
  // Server-side (Node in container) must use docker network.
  if (typeof window === "undefined") {
    return process.env.API_INTERNAL_BASE_URL ?? "http://backend:8000";
  }
  // Client-side uses host-mapped URL.
  // NOTE: In Next.js, NEXT_PUBLIC_* is embedded at build-time into the client bundle.
  // If it's missing during build, using a localhost fallback breaks production.
  // Prefer same-origin when available.
  const explicit = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (explicit && explicit.trim()) return explicit.trim();
  if (typeof window !== "undefined" && window.location && window.location.origin) {
    const origin = window.location.origin;
    if (origin && !origin.includes("localhost")) return origin;
  }
  return "http://localhost:8001";
}

/** Backend API のパスプレフィックス（`/uploads` など静的配信は含まない） */
const API_PREFIX = "/api";

/** API の絶対URL（JSON 以外のレスポンス取得・ダウンロード用） */
export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl()}${API_PREFIX}${p}`;
}

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), {
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
  const res = await fetch(apiUrl(path), {
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
  const res = await fetch(apiUrl(path), {
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
  const res = await fetch(apiUrl(path), {
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

