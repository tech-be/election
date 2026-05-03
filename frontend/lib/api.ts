export type Tenant = {
  id: number;
  name: string;
  active: boolean;
  coupons_enabled: boolean;
  /** テナントあたり作成可能な企画数の上限（既定 3） */
  max_campaigns: number;
  /** 任意（未設定時は null） */
  phone?: string | null;
  address?: string | null;
  created_at: string;
  updated_at: string;
};

/** GET /admin/tenants（ページング・シスアドのみ） */
export type AdminTenantListResponse = {
  items: Tenant[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

/** /admin/tenants の page_size 上限に合わせる（ドロップダウン用の一括取得） */
export const ADMIN_TENANTS_LIST_MAX_PAGE_SIZE = 5000;

export type AuthMe = {
  id: number;
  email: string;
  role: string;
  tenant_id: number | null;
  /** テナント／ユーザ権限のときのみ。シスアドは null */
  tenant_coupons_enabled: boolean | null;
  /** テナント／ユーザ権限のときのみ。シスアドは null */
  tenant_name?: string | null;
};

/** 企画種別マスタ（/admin/campaign-kinds） */
export type CampaignKind = {
  id: number;
  name: string;
};

export type Campaign = {
  id: number;
  tenant_id: number;
  /** FK → campaign_kinds.id */
  campaign_kind_id: number;
  /** 管理画面一覧・取得時のみ付与 */
  campaign_kind_name?: string;
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
  starts_at?: string | null;
  ends_at?: string | null;
  created_at: string;
  updated_at: string;
};

/** GET /admin/campaigns（ページング） */
export type AdminCampaignListResponse = {
  items: Campaign[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

/** /admin/campaigns の page_size 上限に合わせる（クーポン画面など選択肢用の一括取得） */
export const ADMIN_CAMPAIGNS_LIST_MAX_PAGE_SIZE = 5000;

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
  /** 発行開始日 / 利用終了日（未設定なら制限なし） */
  issue_starts_at?: string | null;
  use_ends_at?: string | null;
  /** 管理画面向けテスト用トークン */
  test_token?: string | null;
  created_at: string;
  updated_at: string;
};

/** GET /admin/coupons（ページング） */
export type AdminCouponListResponse = {
  items: Coupon[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
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

/** PATCH /admin/inquiries/:id の状態値（バックエンドと一致） */
export const INQUIRY_STATUS_OPTIONS = ["着信", "処理中", "完了", "対象外"] as const;
export type InquiryStatus = (typeof INQUIRY_STATUS_OPTIONS)[number];

export type Inquiry = {
  id: number;
  name: string;
  email: string;
  message: string;
  /** 未マイグレーション環境では欠ける場合あり */
  status?: InquiryStatus | string;
  created_at: string;
};

/** GET /admin/inquiries（シスアドのみ・ページング） */
export type AdminInquiryListResponse = {
  items: Inquiry[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

/** GET /admin/operation-logs（シスアドのみ） */
export type AdminOperationLogItem = {
  id: number;
  created_at: string;
  user_email: string | null;
  user_role: string | null;
  screen: string;
  operation: string;
  /** バックエンドのハンドラ関数名（Python の endpoint） */
  api_name?: string | null;
  detail: string | null;
};

export type AdminOperationLogListResponse = {
  items: AdminOperationLogItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

/** GET /admin/system/tenant-summary（シスアドのみ） */
export type TenantSummaryRow = {
  tenant_id: number;
  tenant_name: string;
  tenant_admin_count: number;
  tenant_user_count: number;
  campaign_count: number;
  vote_participation_count: number;
  /** クーポン（Coupon マスタ）の登録件数 */
  coupon_count: number;
  coupon_distinct_user_count: number;
};

export type TenantSummaryListResponse = {
  items: TenantSummaryRow[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

/** POST /public/inquiries 成功時 */
export type PublicInquiryResponse = {
  ok: boolean;
  id: number;
  /** true: シスアド宛通知の送信成功 / false: 失敗 / null: SMTP 未設定でスキップ */
  notify_mail_ok: boolean | null;
  notify_mail_error?: string | null;
  /** true: 問い合わせ者への自動返信の送信成功 / false: 失敗 / null: SMTP 未設定でスキップ */
  auto_reply_mail_ok: boolean | null;
  auto_reply_mail_error?: string | null;
};

/** POST /public/register-tenant 成功時（平文パスワードはこのレスポンスのみ） */
export type PublicTenantRegisterResponse = {
  ok: boolean;
  tenant_id: number;
  tenant_name: string;
  user_id: number;
  email: string;
  password: string;
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
  redirectIfSessionExpired(res, init);
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

export async function apiGetWithStatus<T>(
  path: string,
  init?: RequestInit,
): Promise<{ res: Response; data: T }> {
  const res = await fetch(apiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  redirectIfSessionExpired(res, init);
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

function authorizationFromInit(init?: RequestInit): string | null {
  const raw = init?.headers;
  if (!raw) return null;
  if (typeof Headers !== "undefined" && raw instanceof Headers) {
    return raw.get("Authorization") ?? raw.get("authorization");
  }
  const rec = raw as Record<string, string | undefined>;
  for (const k of Object.keys(rec)) {
    if (k.toLowerCase() === "authorization") return rec[k] ?? null;
  }
  return null;
}

/**
 * Bearer 付きリクエストが 401 のとき、セッション切れとみなしてローカル状態を消しログインへ遷移する。
 * （ログイン失敗の 401 は Authorization を付けないため対象外）
 */
export function redirectIfSessionExpired(res: Response, init?: RequestInit): void {
  if (res.status !== 401 || typeof window === "undefined") return;
  const auth = authorizationFromInit(init);
  if (!auth || !/^Bearer\s+\S+/i.test(auth.trim())) return;
  try {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_role");
    localStorage.removeItem("admin_tenant_id");
  } catch {
    /* ignore */
  }
  if (window.location.pathname !== "/admin/login") {
    window.location.assign("/admin/login");
  }
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
  redirectIfSessionExpired(res, init);
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}

/** 管理画面の企画ドロップダウン用に、権限範囲の企画をまとめて取得する */
export async function fetchAdminCampaignsAllForSelect(token: string): Promise<Campaign[]> {
  const q = new URLSearchParams({
    page: "1",
    page_size: String(ADMIN_CAMPAIGNS_LIST_MAX_PAGE_SIZE),
  });
  const res = await apiGet<AdminCampaignListResponse>(`/admin/campaigns?${q.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.items;
}

/** 管理画面のテナント選択用に、テナントをまとめて取得する（シスアドのみ） */
export async function fetchAdminTenantsAllForSelect(token: string): Promise<Tenant[]> {
  const q = new URLSearchParams({
    page: "1",
    page_size: String(ADMIN_TENANTS_LIST_MAX_PAGE_SIZE),
  });
  const res = await apiGet<AdminTenantListResponse>(`/admin/tenants?${q.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.items;
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
  redirectIfSessionExpired(res, init);
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
  redirectIfSessionExpired(res, init);
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
  redirectIfSessionExpired(res, init);
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as T;
}

