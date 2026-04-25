"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { apiGet, apiPost, type Campaign, type Coupon } from "../../lib/api";
import { COUPON_LP_DEFAULT_TITLE } from "../../lib/couponLp";
import { resolveMediaUrl } from "../../lib/products";

type TenantRow = { id: number; name: string };

export function CouponCreatePanel({
  token,
  onClose,
  onCreated,
}: {
  token: string | null;
  onClose: () => void;
  onCreated?: (coupon: Coupon) => void;
}) {
  const [role, setRole] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [tenantIdForCreate, setTenantIdForCreate] = useState("");

  const [name, setName] = useState("");
  const [lpTitle, setLpTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileInputNonce, setFileInputNonce] = useState(0);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignLinkId, setCampaignLinkId] = useState("");

  const filteredCampaigns = useMemo(() => {
    if (role === "sysadmin") {
      if (!tenantIdForCreate) return [];
      const tid = Number(tenantIdForCreate);
      return campaigns.filter((c) => c.tenant_id === tid);
    }
    return campaigns;
  }, [role, tenantIdForCreate, campaigns]);

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
        if (rows.length === 1) setTenantIdForCreate(String(rows[0].id));
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
    if (role !== "sysadmin") return;
    setCampaignLinkId("");
  }, [role, tenantIdForCreate]);

  const uploadImage = useCallback(
    async (file: File) => {
      if (!token) throw new Error("not logged in");
      const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001";
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

  return (
    <div className="space-y-6">
      {mounted && !token ? (
        <div className="rounded-2xl border border-rose-800/60 bg-rose-950/20 p-4 text-sm text-rose-200">
          ログイン情報がありません。先にログインしてください。
        </div>
      ) : null}

      <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        {role === "sysadmin" ? (
          <label className="block text-sm text-slate-200">
            紐づけるテナント
            <select
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400"
              value={tenantIdForCreate}
              onChange={(e) => {
                setTenantIdForCreate(e.target.value);
                setCampaignLinkId("");
              }}
            >
              <option value="">選択してください</option>
              {tenants.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.name}（ID: {t.id}）
                </option>
              ))}
            </select>
            {tenants.length === 0 && token ? (
              <p className="mt-2 text-xs text-amber-200">
                テナントがありません。先に{" "}
                <Link className="underline" href="/admin/tenants">
                  テナント管理
                </Link>{" "}
                から作成してください。
              </p>
            ) : null}
          </label>
        ) : null}

        <label className="block text-sm text-slate-200">
          連動する企画
          <select
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400 disabled:opacity-50"
            value={campaignLinkId}
            onChange={(e) => setCampaignLinkId(e.target.value)}
            disabled={!token || (role === "sysadmin" && tenantIdForCreate.length === 0)}
          >
            <option value="">企画に連動しない</option>
            {filteredCampaigns.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}（{c.code}）
              </option>
            ))}
          </select>
          {role === "sysadmin" && tenantIdForCreate.length === 0 ? (
            <p className="mt-1 text-xs text-slate-500">先にテナントを選択すると、登録済みの企画から選べます。</p>
          ) : null}
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
          <p className="text-xs text-slate-500">画像をアップロードすると URL が設定されます（「登録する」で保存されます）。</p>
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
              setError(null);
              try {
                const url = await uploadImage(file);
                setImageUrl(url);
                setFileInputNonce((n) => n + 1);
              } catch {
                setError("画像のアップロードに失敗しました");
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

        {error ? (
          <div className="rounded-xl border border-rose-800/60 bg-rose-950/20 p-3 text-sm text-rose-200">{error}</div>
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
            disabled={!token || loading || name.trim().length === 0 || (role === "sysadmin" && tenantIdForCreate.length === 0)}
            onClick={async () => {
              if (!token) return;
              setLoading(true);
              setError(null);
              try {
                const body: Record<string, unknown> = {
                  name: name.trim(),
                  lp_title: lpTitle.trim() ? lpTitle.trim() : null,
                  image_url: imageUrl.trim() ? imageUrl : null,
                  description: description.trim() ? description.trim() : null,
                  campaign_id: campaignLinkId ? Number(campaignLinkId) : null,
                };
                if (role === "sysadmin") body.tenant_id = Number(tenantIdForCreate);
                const created = await apiPost<Coupon>("/admin/coupons", body, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                onCreated?.(created);
                onClose();
              } catch {
                setError("登録に失敗しました（入力エラー/権限不足の可能性）");
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? "登録中…" : "登録する"}
          </button>
        </div>
      </section>
    </div>
  );
}

