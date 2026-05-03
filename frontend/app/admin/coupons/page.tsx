"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  type AdminCouponListResponse,
  apiDelete,
  apiGet,
  apiUrl,
  fetchAdminCampaignsAllForSelect,
  fetchAdminTenantsAllForSelect,
  redirectIfSessionExpired,
  type Campaign,
  type Coupon,
} from "../../../lib/api";
import { useCouponAdminAccess } from "../../../lib/useCouponAdminAccess";
import { Modal } from "../../../components/admin/Modal";
import { CouponEditPanel } from "../../../components/admin/CouponEditPanel";
import { CouponCreatePanel } from "../../../components/admin/CouponCreatePanel";
import { CouponFeatureDisabledNotice } from "../../../components/admin/CouponFeatureDisabledNotice";
import { resolveMediaUrl } from "../../../lib/products";
import { useRedirectIfMissingAdminToken } from "../../../lib/useRedirectIfMissingAdminToken";

export default function AdminCouponsPage() {
  const [page, setPage] = useState(1);
  const [listData, setListData] = useState<AdminCouponListResponse | null>(null);
  const [listLoading, setListLoading] = useState(false);
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

  const couponAccess = useCouponAdminAccess(token, mounted);

  useEffect(() => {
    setMounted(true);
    setToken(localStorage.getItem("admin_token"));
    setRole(localStorage.getItem("admin_role") ?? "");
  }, []);

  useRedirectIfMissingAdminToken(mounted, token);

  const loadCouponPage = useCallback(
    async (p: number) => {
      if (!token || couponAccess !== "full") return;
      setListLoading(true);
      setError(null);
      try {
        const q = new URLSearchParams({ page: String(p) });
        const data = await apiGet<AdminCouponListResponse>(`/admin/coupons?${q.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setListData(data);
      } catch {
        setListData(null);
        setError("取得に失敗しました");
      } finally {
        setListLoading(false);
      }
    },
    [token, couponAccess],
  );

  useEffect(() => {
    void loadCouponPage(page);
  }, [page, loadCouponPage]);

  useEffect(() => {
    if (!listData) return;
    if (page > listData.total_pages) {
      setPage(listData.total_pages);
    }
  }, [listData, page]);

  const rows = listData?.items ?? [];
  const totalPages = listData?.total_pages ?? 1;

  const pageButtons = useMemo(() => {
    const n = totalPages;
    if (n <= 20) return Array.from({ length: n }, (_, i) => i + 1);
    const windowSize = 7;
    const half = Math.floor(windowSize / 2);
    let start = Math.max(1, page - half);
    let end = Math.min(n, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [totalPages, page]);

  useEffect(() => {
    if (!token || couponAccess !== "full") return;
    (async () => {
      try {
        const c = await fetchAdminCampaignsAllForSelect(token);
        setCampaigns(c);
      } catch {
        setCampaigns([]);
      }
    })();
  }, [token, couponAccess]);

  useEffect(() => {
    if (!token || role !== "sysadmin" || couponAccess !== "full") return;
    (async () => {
      try {
        const tenants = await fetchAdminTenantsAllForSelect(token);
        const map: Record<number, string> = {};
        for (const t of tenants) map[t.id] = t.name;
        setTenantNameById(map);
      } catch {
        setTenantNameById({});
      }
    })();
  }, [token, role, couponAccess]);

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
          <h1 className="text-2xl font-semibold tracking-tight">クーポン一覧</h1>
        </div>
        {couponAccess === "full" ? (
          <button
            className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
            type="button"
            disabled={!token}
            onClick={() => setCreatingOpen(true)}
          >
            新規登録
          </button>
        ) : null}
      </header>

      {mounted && token && couponAccess === "loading" ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-950/40 p-4 text-sm text-slate-300">
          読み込み中…
        </div>
      ) : null}

      {mounted && token && couponAccess === "disabled" ? <CouponFeatureDisabledNotice /> : null}

      {couponAccess === "full" && error ? (
        <div className="rounded-2xl border border-rose-800/60 bg-rose-950/20 p-4 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {couponAccess === "full" ? (
      <>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
        <div>
          {listLoading ? (
            "読み込み中…"
          ) : listData ? (
            <>
              全 {listData.total} 件 · 1ページ {listData.page_size} 件 · ページ {listData.page} / {listData.total_pages}
            </>
          ) : (
            "—"
          )}
        </div>
        <button
          type="button"
          disabled={listLoading || !token}
          className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-slate-500 disabled:opacity-50"
          onClick={() => void loadCouponPage(page)}
        >
          更新
        </button>
      </div>

      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={listLoading || page <= 1}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 hover:border-slate-500 disabled:opacity-40"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            前へ
          </button>
          <div className="flex flex-wrap gap-1">
            {pageButtons.map((p) => (
              <button
                key={p}
                type="button"
                disabled={listLoading}
                className={[
                  "min-w-[2.25rem] rounded-lg border px-2 py-1.5 text-sm",
                  p === page
                    ? "border-indigo-400/80 bg-indigo-500/20 text-indigo-100"
                    : "border-slate-700 bg-slate-950 text-slate-200 hover:border-slate-500",
                ].join(" ")}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={listLoading || page >= totalPages}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 hover:border-slate-500 disabled:opacity-40"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            次へ
          </button>
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
          {rows.length === 0 && !listLoading ? (
            <div className="px-4 py-6 text-sm text-slate-300">クーポンがありません</div>
          ) : rows.length === 0 && listLoading ? (
            <div className="px-4 py-6 text-sm text-slate-400">読み込み中…</div>
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
                          const csvReq: RequestInit = {
                            headers: { Authorization: `Bearer ${token}` },
                          };
                          const res = await fetch(apiUrl(`/admin/coupons/${r.id}/issued-csv`), csvReq);
                          redirectIfSessionExpired(res, csvReq);
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
                        await loadCouponPage(page);
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
      </>
      ) : null}

      {editingId != null && token && couponAccess === "full" ? (
        <Modal title="クーポン編集" maxWidthClassName="max-w-6xl" onClose={() => setEditingId(null)}>
          <CouponEditPanel
            couponId={editingId}
            token={token}
            onClose={() => setEditingId(null)}
            onSaved={(u) =>
              setListData((prev) =>
                prev
                  ? {
                      ...prev,
                      items: prev.items.map((x) => (x.id === u.id ? { ...x, ...u } : x)),
                    }
                  : prev,
              )
            }
          />
        </Modal>
      ) : null}

      {creatingOpen && token && couponAccess === "full" ? (
        <Modal title="クーポン新規登録" maxWidthClassName="max-w-6xl" onClose={() => setCreatingOpen(false)}>
          <CouponCreatePanel
            token={token}
            onClose={() => setCreatingOpen(false)}
            onCreated={() => {
              setPage(1);
              void loadCouponPage(1);
            }}
          />
        </Modal>
      ) : null}
    </main>
  );
}
