"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { apiGet, apiPatch, type Campaign, type Coupon } from "../../lib/api";
import { COUPON_LP_DEFAULT_TITLE } from "../../lib/couponLp";
import { resolveMediaUrl } from "../../lib/products";

type TenantRow = { id: number; name: string };

export function CouponEditPanel({
  couponId,
  token,
  onClose,
  onSaved,
  showBackToList = false,
}: {
  couponId: number;
  token: string | null;
  onClose: () => void;
  onSaved?: (updated: Partial<Coupon> & { id: number }) => void;
  /** モーダルでは不要だが、ページ表示で使うためのスイッチ */
  showBackToList?: boolean;
}) {
  const [role, setRole] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [tenantId, setTenantId] = useState("");

  const [name, setName] = useState("");
  const [lpTitle, setLpTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [fileInputNonce, setFileInputNonce] = useState(0);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignLinkId, setCampaignLinkId] = useState("");

  const effectiveTenantId = tenantId.length > 0 ? Number(tenantId) : NaN;
  const filteredCampaigns = useMemo(() => {
    if (!Number.isFinite(effectiveTenantId)) return [];
    return campaigns.filter((c) => c.tenant_id === effectiveTenantId);
  }, [campaigns, effectiveTenantId]);

  useEffect(() => {
    setMounted(true);
    setRole(localStorage.getItem("admin_role") ?? "");
  }, []);

  useEffect(() => {
    if (!token || role !== "sysadmin") return;
    (async () => {
      try {
        const rows = await apiGet<TenantRow[]>("/admin/tenants", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTenants(rows);
      } catch {
        setTenants([]);
      }
    })();
  }, [token, role]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const c = await apiGet<Campaign[]>("/admin/campaigns", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCampaigns(c);
      } catch {
        setCampaigns([]);
      }
    })();
  }, [token]);

  useEffect(() => {
    if (!token || !Number.isFinite(couponId)) return;
    (async () => {
      setPageLoading(true);
      setLoadError(null);
      try {
        const c = await apiGet<Coupon>(`/admin/coupons/${couponId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setName(c.name ?? "");
        setLpTitle(c.lp_title ?? "");
        setImageUrl(c.image_url ?? "");
        setDescription(c.description ?? "");
        setTenantId(String(c.tenant_id));
        setCampaignLinkId(c.campaign_id != null ? String(c.campaign_id) : "");
      } catch {
        setLoadError("取得に失敗しました");
      } finally {
        setPageLoading(false);
      }
    })();
  }, [token, couponId]);

  const uploadImage = useCallback(
    async (file: File) => {
      if (!token) throw new Error("not logged in");
      const base =
        (process.env.NEXT_PUBLIC_API_BASE_URL && process.env.NEXT_PUBLIC_API_BASE_URL.trim()) ||
        (typeof window !== "undefined" && window.location ? window.location.origin : "") ||
        "http://localhost:8001";
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${base}/api/admin/uploads`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { url: string };
      return `${base}${data.url}`;
    },
    [token],
  );

  const invalidId = !Number.isFinite(couponId);

  const selectedCampaignNum = campaignLinkId ? Number(campaignLinkId) : NaN;
  const orphanCampaignSelected =
    Number.isFinite(selectedCampaignNum) &&
    !filteredCampaigns.some((c) => c.id === selectedCampaignNum);

  return (
    <div className="space-y-6">
      {mounted && !token ? (
        <div className="rounded-2xl border border-rose-800/60 bg-rose-950/20 p-4 text-sm text-rose-200">
          ログイン情報がありません。先にログインしてください。
        </div>
      ) : null}

      {invalidId ? (
        <div className="rounded-2xl border border-rose-800/60 bg-rose-950/20 p-4 text-sm text-rose-200">
          不正な ID です。
        </div>
      ) : null}

      {pageLoading ? <div className="text-sm text-slate-400">読み込み中…</div> : null}

      {loadError ? (
        <div className="rounded-2xl border border-rose-800/60 bg-rose-950/20 p-4 text-sm text-rose-200">
          {loadError}
        </div>
      ) : null}

      {!invalidId && !pageLoading && !loadError ? (
        <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-semibold text-slate-100">クーポン編集</div>
            <div className="flex flex-wrap gap-2">
              <Link
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 hover:border-slate-500"
                href={`/coupon-preview/${couponId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                LPテスト表示
              </Link>
              {showBackToList ? (
                <Link
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 hover:border-slate-500"
                  href="/admin/coupons"
                >
                  一覧へ戻る
                </Link>
              ) : null}
            </div>
          </div>

          {role === "sysadmin" ? (
            <label className="block text-sm text-slate-200">
              紐づけるテナント
              <select
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400"
                value={tenantId}
                onChange={(e) => {
                  setTenantId(e.target.value);
                  setCampaignLinkId("");
                }}
              >
                {tenants.map((t) => (
                  <option key={t.id} value={String(t.id)}>
                    {t.name}（ID: {t.id}）
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="block text-sm text-slate-200">
            連動する企画
            <select
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400 disabled:opacity-50"
              value={campaignLinkId}
              onChange={(e) => setCampaignLinkId(e.target.value)}
              disabled={!token || !Number.isFinite(effectiveTenantId)}
            >
              <option value="">企画に連動しない</option>
              {orphanCampaignSelected ? (
                <option value={String(selectedCampaignNum)}>
                  ID:{selectedCampaignNum}（一覧にない場合は保存で解除できます）
                </option>
              ) : null}
              {filteredCampaigns.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}（{c.code}）
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm text-slate-200">
            クーポン名
            <input
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：春のお得クーポン"
            />
          </label>

          <label className="block text-sm text-slate-200">
            クーポン画面のタイトル
            <input
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400"
              value={lpTitle}
              onChange={(e) => setLpTitle(e.target.value)}
              placeholder={COUPON_LP_DEFAULT_TITLE}
            />
            <p className="mt-1 text-xs text-slate-500">
              来場者向けクーポン画面（LP）の大見出し。未入力のときは上のプレースホルダーと同じ文言を表示します。
            </p>
          </label>

          <div className="space-y-2">
            <div className="text-sm text-slate-200">クーポン画像</div>
            <p className="text-xs text-slate-500">
              画像をアップロードすると URL が設定されます（「更新する」で保存されます）。
            </p>
            <input
              key={`img-${fileInputNonce}`}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              disabled={!token || uploading}
              className="block w-full text-sm text-slate-200 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-100 hover:file:bg-slate-700 disabled:opacity-50"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !token) return;
                setUploading(true);
                setSaveError(null);
                try {
                  const url = await uploadImage(file);
                  setImageUrl(url);
                  setFileInputNonce((n) => n + 1);
                } catch {
                  setSaveError("画像のアップロードに失敗しました");
                } finally {
                  setUploading(false);
                }
              }}
            />
            {uploading ? <div className="text-xs text-slate-400">アップロード中…</div> : null}
            {imageUrl ? (
              <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <div className="text-xs text-slate-400">プレビュー</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveMediaUrl(imageUrl)}
                  alt="クーポン"
                  className="max-h-48 w-auto max-w-full rounded-lg border border-slate-800 object-contain"
                />
                <button
                  type="button"
                  className="text-xs text-rose-300 underline hover:text-rose-200"
                  onClick={() => {
                    setImageUrl("");
                    setFileInputNonce((n) => n + 1);
                  }}
                >
                  画像を外す
                </button>
              </div>
            ) : (
              <div className="text-xs text-slate-500">未設定</div>
            )}
          </div>

          <label className="block text-sm text-slate-200">
            クーポン説明
            <textarea
              className="mt-2 min-h-32 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="利用条件や注意事項など"
            />
          </label>

          {saveError ? (
            <div className="rounded-xl border border-rose-800/60 bg-rose-950/20 p-3 text-sm text-rose-200">
              {saveError}
            </div>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <button
              type="button"
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-600 bg-transparent px-4 py-2 text-sm font-semibold text-slate-300 hover:border-slate-500 hover:bg-slate-900/60 disabled:opacity-50"
              disabled={loading}
              onClick={onClose}
            >
              閉じる
            </button>
            <button
              type="button"
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
              disabled={
                !token ||
                loading ||
                name.trim().length === 0 ||
                (role === "sysadmin" && tenantId.length === 0)
              }
              onClick={async () => {
                if (!token) return;
                setLoading(true);
                setSaveError(null);
                try {
                  const body: Record<string, unknown> = {
                    name: name.trim(),
                    lp_title: lpTitle.trim() ? lpTitle.trim() : null,
                    image_url: imageUrl.trim() ? imageUrl : null,
                    description: description.trim() ? description.trim() : null,
                    campaign_id: campaignLinkId ? Number(campaignLinkId) : null,
                  };
                  if (role === "sysadmin") body.tenant_id = Number(tenantId);
                  await apiPatch<Coupon>(`/admin/coupons/${couponId}`, body, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  onSaved?.({
                    id: couponId,
                    name: name.trim(),
                    description: description.trim() ? description.trim() : null,
                    image_url: imageUrl.trim() ? imageUrl : null,
                    lp_title: lpTitle.trim() ? lpTitle.trim() : null,
                    campaign_id: campaignLinkId ? Number(campaignLinkId) : null,
                  });
                  onClose();
                } catch {
                  setSaveError("更新に失敗しました");
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? "更新中…" : "更新する"}
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

