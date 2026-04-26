/** 管理画面・LP 共通のアイテムJSON（products_json）の型とパース */

export type ProductDraft = {
  name: string;
  description: string;
  image1Url?: string | null;
  image2Url?: string | null;
  image3Url?: string | null;
  /** 一覧の並び替え・React key 用（任意・保存時に products_json に含まれる） */
  sortId?: string | null;
};

function normalizeProduct(item: unknown): ProductDraft {
  if (item != null && typeof item === "object" && !Array.isArray(item)) {
    const o = item as Record<string, unknown>;
    return {
      name: String(o.name ?? ""),
      description: String(o.description ?? ""),
      image1Url: o.image1Url != null ? String(o.image1Url) : null,
      image2Url: o.image2Url != null ? String(o.image2Url) : null,
      image3Url: o.image3Url != null ? String(o.image3Url) : null,
      sortId: o.sortId != null ? String(o.sortId) : null,
    };
  }
  if (typeof item === "string") {
    return {
      name: item,
      description: "",
      image1Url: null,
      image2Url: null,
      image3Url: null,
    };
  }
  return {
    name: "",
    description: "",
    image1Url: null,
    image2Url: null,
    image3Url: null,
  };
}

export function parseProductsJson(raw: string | null | undefined): ProductDraft[] {
  if (!raw || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeProduct);
  } catch {
    return [];
  }
}

export function productsToJson(products: ProductDraft[]): string {
  return JSON.stringify(products);
}

/** 相対パス `/uploads/...` を API オリジン付きの絶対URLにする（LP・プレビュー用） */
export function resolveMediaUrl(url: string | null | undefined): string {
  const u = (url ?? "").trim();
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  const explicit = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_API_BASE_URL : undefined;
  const base =
    explicit && explicit.trim()
      ? explicit.trim()
      : typeof window !== "undefined" && window.location && window.location.origin
        ? window.location.origin
        : "http://localhost:8001";
  return u.startsWith("/") ? `${base}${u}` : `${base}/${u}`;
}
