"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiDelete, apiGet, apiUrl, type Campaign, type Coupon } from "../../../lib/api";
import { Modal } from "../../../components/admin/Modal";
import { CouponEditPanel } from "../../../components/admin/CouponEditPanel";
import { CouponCreatePanel } from "../../../components/admin/CouponCreatePanel";
import { resolveMediaUrl } from "../../../lib/products";

type TenantRow = { id: number; name: string };

export default function AdminCouponsPage() {
  const [rows, setRows] = useState<Coupon[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const [tenantNameById, setTenantNameById] = useState<Record<number, string>>({});
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [downloadingIssuedId, setDownloadingIssuedId] = useState<number | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creatingOpen, setCreatingOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    setToken(localStorage.getItem("admin_token"));
    setRole(localStorage.getItem("admin_role") ?? "");
  }, []);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setError(null);
      try {
        const data = await apiGet<Coupon[]>("/admin/coupons", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRows(data);
      } catch {
        setError("取得に失敗しました");
      }
    })();
  }, [token]);

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
    if (!token || role !== "sysadmin") return;
    (async () => {
      try {
        const tenants = await apiGet<TenantRow[]>("/admin/tenants", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const map: Record<number, string> = {};
        for (const t of tenants) map[t.id] = t.name;
        setTenantNameById(map);
      } catch {
        setTenantNameById({});
      }
    })();
  }, [token, role]);

  function tenantDisplayName(tenantId: number): string {
    return tenantNameById[tenantId] ?? `（ID: ${tenantId}）`;
  }

  function campaignDisplayLabel(campaignId: number | null | undefined): string {
    if (campaignId == null) return "—";
    const c = campaigns.find((x) => x.id === campaignId);
    return c ? `${c.name}（${c.code}）` : `ID:${campaignId}`;
  }

  return (
    <main className="w-full max-w-none space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400">管理画面</div>
          <h1 className="text-2xl font-semibold tracking-tight">クーポン一覧</h1>
        </div>
        <button
          className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
          type="button"
          disabled={!token}
          onClick={() => setCreatingOpen(true)}
        >
          新規登録
        </button>
      </header>

      {mounted && !token ? (
        <div className="rounded-2xl border border-rose-800/60 bg-rose-950/20 p-4 text-sm text-rose-200">
          ログイン情報がありません。先に{" "}
          <Link className="underline" href="/admin/login">
            ログイン
          </Link>{" "}
          してください。
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-800/60 bg-rose-950/20 p-4 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-slate-800">
        <div className="grid grid-cols-12 gap-0 bg-slate-900/50 px-4 py-3 text-xs text-slate-300">
          {role === "sysadmin" ? <div className="col-span-2">テナント</div> : null}
          <div className={role === "sysadmin" ? "col-span-2" : "col-span-3"}>画像</div>
          <div className={role === "sysadmin" ? "col-span-2" : "col-span-2"}>クーポン名</div>
          <div className={role === "sysadmin" ? "col-span-2" : "col-span-2"}>連動企画</div>
          <div className={role === "sysadmin" ? "col-span-2" : "col-span-3"}>説明</div>
          <div className="col-span-2">操作</div>
        </div>
        <div className="divide-y divide-slate-800 bg-slate-950/40">
          {rows.length === 0 ? (
            <div className="px-4 py-6 text-sm text-slate-300">クーポンがありません</div>
          ) : (
            rows.map((r) => (
              <div key={r.id} className="grid grid-cols-12 gap-0 px-4 py-4 text-sm">
                {role === "sysadmin" ? (
                  <div className="col-span-2 min-w-0">
                    <div className="truncate text-slate-100" title={tenantDisplayName(r.tenant_id)}>
                      {tenantDisplayName(r.tenant_id)}
                    </div>
                  </div>
                ) : null}
                <div
                  className={`flex items-start ${role === "sysadmin" ? "col-span-2" : "col-span-3"}`}
                >
                  {r.image_url ? (
                    <div className="w-[100px] shrink-0 overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolveMediaUrl(r.image_url)}
                        alt=""
                        className="h-auto w-[100px] max-w-[100px] object-cover"
                        width={100}
                      />
                    </div>
                  ) : (
                    <div className="flex h-14 w-[100px] items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-600">
                      なし
                    </div>
                  )}
                </div>
                <div
                  className={`font-medium text-slate-100 ${role === "sysadmin" ? "col-span-2" : "col-span-2"}`}
                >
                  {r.name}
                </div>
                <div
                  className={`min-w-0 text-slate-300 ${role === "sysadmin" ? "col-span-2" : "col-span-2"}`}
                >
                  <span
                    className="line-clamp-2 break-words"
                    title={campaignDisplayLabel(r.campaign_id ?? null)}
                  >
                    {campaignDisplayLabel(r.campaign_id ?? null)}
                  </span>
                </div>
                <div
                  className={`min-w-0 whitespace-pre-wrap text-slate-300 ${role === "sysadmin" ? "col-span-2" : "col-span-3"}`}
                >
                  {r.description?.trim() ? r.description : (
                    <span className="text-slate-600">—</span>
                  )}
                </div>
                <div className="col-span-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <button
                    type="button"
                    className="text-slate-200 underline hover:text-white disabled:opacity-50"
                    disabled={!token}
                    onClick={() => setEditingId(r.id)}
                  >
                    編集
                  </button>
                  <Link
                    className="text-sm text-indigo-300 underline hover:text-indigo-200"
                    href={`/coupon-preview/${r.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    LPテスト表示
                  </Link>
                  <button
                    type="button"
                    className="text-sm text-sky-300 underline hover:text-sky-200 disabled:opacity-50"
                    disabled={!token || downloadingIssuedId !== null}
                    onClick={() => {
                      if (!token) return;
                      setDownloadingIssuedId(r.id);
                      setError(null);
                      void (async () => {
                        try {
                          const res = await fetch(apiUrl(`/admin/coupons/${r.id}/issued-csv`), {
                            headers: { Authorization: `Bearer ${token}` },
                          });
                          if (!res.ok) throw new Error(await res.text());
                          const blob = await res.blob();
                          const href = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = href;
                          const safe = r.name.replace(/[^\w.-]+/g, "_").slice(0, 80) || `coupon-${r.id}`;
                          a.download = `${safe}-issued-coupons.csv`;
                          a.rel = "noopener";
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                          URL.revokeObjectURL(href);
                        } catch {
                          setError("発行一覧のダウンロードに失敗しました");
                        } finally {
                          setDownloadingIssuedId(null);
                        }
                      })();
                    }}
                  >
                    {downloadingIssuedId === r.id ? "取得中…" : "発行CSV"}
                  </button>
                  <button
                    type="button"
                    className="text-sm text-rose-300 underline hover:text-rose-200 disabled:opacity-50"
                    disabled={!token || deletingId === r.id}
                    onClick={async () => {
                      if (!token) return;
                      if (
                        !window.confirm(
                          `クーポン「${r.name}」を削除しますか？\nこの操作は取り消せません。`,
                        )
                      ) {
                        return;
                      }
                      setDeletingId(r.id);
                      setError(null);
                      try {
                        await apiDelete<{ ok: boolean }>(`/admin/coupons/${r.id}`, {
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        setRows((prev) => prev.filter((x) => x.id !== r.id));
                      } catch {
                        setError("削除に失敗しました");
                      } finally {
                        setDeletingId(null);
                      }
                    }}
                  >
                    {deletingId === r.id ? "削除中…" : "削除"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {editingId != null && token ? (
        <Modal title="クーポン編集" maxWidthClassName="max-w-6xl" onClose={() => setEditingId(null)}>
          <CouponEditPanel
            couponId={editingId}
            token={token}
            onClose={() => setEditingId(null)}
            onSaved={(u) => setRows((prev) => prev.map((x) => (x.id === u.id ? { ...x, ...u } : x)))}
          />
        </Modal>
      ) : null}

      {creatingOpen && token ? (
        <Modal title="クーポン新規登録" maxWidthClassName="max-w-6xl" onClose={() => setCreatingOpen(false)}>
          <CouponCreatePanel
            token={token}
            onClose={() => setCreatingOpen(false)}
            onCreated={(c) => setRows((prev) => [c, ...prev])}
          />
        </Modal>
      ) : null}
    </main>
  );
}
