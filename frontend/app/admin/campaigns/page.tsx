"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  type AdminCampaignListResponse,
  apiDelete,
  apiGet,
  apiUrl,
  fetchAdminTenantsAllForSelect,
  redirectIfSessionExpired,
  type Campaign,
  type CampaignVoteResults,
  type Tenant,
} from "../../../lib/api";
import { Modal } from "../../../components/admin/Modal";
import { CampaignEditPanel } from "../../../components/admin/CampaignEditPanel";
import { CampaignCreatePanel } from "../../../components/admin/CampaignCreatePanel";
import { PlanLimitHint } from "../../../components/admin/PlanLimitHint";
import { resolveMediaUrl } from "../../../lib/products";
import { useRedirectIfMissingAdminToken } from "../../../lib/useRedirectIfMissingAdminToken";

export default function AdminCampaignsPage() {
  const [page, setPage] = useState(1);
  const [listData, setListData] = useState<AdminCampaignListResponse | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const [deletingCode, setDeletingCode] = useState<string | null>(null);
  const [tenantNameById, setTenantNameById] = useState<Record<number, string>>({});
  const [resultsForCode, setResultsForCode] = useState<string | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsData, setResultsData] = useState<CampaignVoteResults | null>(null);
  const [resultsError, setResultsError] = useState<string | null>(null);
  const [downloadingEmailsCode, setDownloadingEmailsCode] = useState<string | null>(null);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [creatingOpen, setCreatingOpen] = useState(false);
  const [campaignLimitModalText, setCampaignLimitModalText] = useState<string | null>(null);
  const [planTenant, setPlanTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    setMounted(true);
    setToken(localStorage.getItem("admin_token"));
    setRole(localStorage.getItem("admin_role") ?? "");
  }, []);

  useRedirectIfMissingAdminToken(mounted, token);

  useEffect(() => {
    if (!token) return;
    const rr = (role ?? "").trim().toLowerCase();
    if (rr !== "tenant" && rr !== "user") {
      setPlanTenant(null);
      return;
    }
    const tidRaw =
      typeof window !== "undefined" ? (localStorage.getItem("admin_tenant_id") ?? "").trim() : "";
    const tid = tidRaw && /^\d+$/.test(tidRaw) ? Number(tidRaw) : NaN;
    if (!Number.isFinite(tid)) {
      setPlanTenant(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const t = await apiGet<Tenant>(`/admin/tenants/${tid}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!cancelled) setPlanTenant(t);
      } catch {
        if (!cancelled) setPlanTenant(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, role]);

  const loadCampaignPage = useCallback(
    async (p: number) => {
      if (!token) return;
      setListLoading(true);
      setError(null);
      try {
        const q = new URLSearchParams({ page: String(p) });
        const data = await apiGet<AdminCampaignListResponse>(`/admin/campaigns?${q.toString()}`, {
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
    [token],
  );

  useEffect(() => {
    void loadCampaignPage(page);
  }, [page, loadCampaignPage]);

  useEffect(() => {
    if (!listData) return;
    if (page > listData.total_pages) {
      setPage(listData.total_pages);
    }
  }, [listData, page]);

  const rows = listData?.items ?? [];
  const totalPages = listData?.total_pages ?? 1;
  const campaignTotal = listData?.total ?? 0;

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
    if (!token || role !== "sysadmin") return;
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
  }, [token, role]);

  function tenantDisplayName(tenantId: number): string {
    return tenantNameById[tenantId] ?? `（ID: ${tenantId}）`;
  }

  const viewerRoleLc = (role ?? "").trim().toLowerCase();
  const showTenantPlanUsage = viewerRoleLc === "tenant" || viewerRoleLc === "user";

  return (
    <main className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight">企画一覧</h1>
          {showTenantPlanUsage ? (
            <div className="flex flex-wrap gap-x-8 gap-y-1 text-sm leading-relaxed text-slate-300">
              <span>
                現在の企画数：
                <span className="ml-1 tabular-nums font-medium text-slate-100">{campaignTotal}</span>
              </span>
              <PlanLimitHint valueLabel={planTenant != null ? planTenant.max_campaigns ?? 3 : "—"} />
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
            type="button"
            disabled={!token}
            onClick={() => {
              if (!token) return;
              void (async () => {
                const rr = (role ?? "").trim().toLowerCase();
                if (rr === "tenant" || rr === "user") {
                  const tidRaw = (typeof window !== "undefined" ? localStorage.getItem("admin_tenant_id") : null)?.trim();
                  const tid = tidRaw && /^\d+$/.test(tidRaw) ? Number(tidRaw) : NaN;
                  if (Number.isFinite(tid)) {
                    try {
                      const t = await apiGet<Tenant>(`/admin/tenants/${tid}`, {
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      const max = typeof t.max_campaigns === "number" ? t.max_campaigns : 3;
                      const count = campaignTotal;
                      if (count >= max) {
                        setCampaignLimitModalText(
                          `このテナントで作成できる企画は最大 ${max} 件です（現在 ${count} 件登録済み）。\n\n上限を上げるにはプランの変更が必要です。問い合わせフォームより「プラン変更希望」としてテナント名とご担当者様のご連絡先を記載の上、お問い合わせください。`,
                        );
                        return;
                      }
                    } catch {
                      /* 取得に失敗した場合はフォームを開き、サーバー側で検証する */
                    }
                  }
                }
                setCreatingOpen(true);
              })();
            }}
          >
            企画新規登録
          </button>
        </div>
      </header>

      {error ? (
        <div className="rounded-2xl border border-rose-800/60 bg-rose-950/20 p-4 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

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
          onClick={() => void loadCampaignPage(page)}
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
          {role === "sysadmin" ? <div className="col-span-3">テナント</div> : null}
          <div className={role === "sysadmin" ? "col-span-2" : "col-span-3"}>コード</div>
          <div className={role === "sysadmin" ? "col-span-2" : "col-span-2"}>企画種別</div>
          <div className={role === "sysadmin" ? "col-span-3" : "col-span-4"}>名称</div>
          <div className={role === "sysadmin" ? "col-span-2" : "col-span-3"}>操作</div>
        </div>
        <div className="divide-y divide-slate-800 bg-slate-950/40">
          {rows.length === 0 && !listLoading ? (
            <div className="px-4 py-6 text-sm text-slate-300">
              企画がありません
            </div>
          ) : rows.length === 0 && listLoading ? (
            <div className="px-4 py-6 text-sm text-slate-400">読み込み中…</div>
          ) : (
            rows.map((r) => (
              <div
                key={r.id}
                className="grid grid-cols-12 gap-0 px-4 py-4 text-sm"
              >
                {role === "sysadmin" ? (
                  <div className="col-span-3 min-w-0">
                    <div className="truncate font-medium text-slate-100" title={tenantDisplayName(r.tenant_id)}>
                      {tenantDisplayName(r.tenant_id)}
                    </div>
                    <div className="font-mono text-xs text-slate-500">ID {r.tenant_id}</div>
                  </div>
                ) : null}
                <div className={`font-mono text-slate-200 ${role === "sysadmin" ? "col-span-2" : "col-span-3"}`}>
                  {r.code}
                </div>
                <div className={role === "sysadmin" ? "col-span-2 text-slate-100" : "col-span-2 text-slate-100"}>
                  <span className="truncate" title={r.campaign_kind_name ?? ""}>
                    {r.campaign_kind_name ?? "—"}
                  </span>
                </div>
                <div className={role === "sysadmin" ? "col-span-3 text-slate-100" : "col-span-4 text-slate-100"}>
                  {r.name}
                </div>
                <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 ${role === "sysadmin" ? "col-span-2" : "col-span-3"}`}>
                  <button
                    type="button"
                    className="text-slate-200 underline hover:text-white disabled:opacity-50"
                    disabled={!token}
                    onClick={() => setEditingCode(r.code)}
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    className="text-sm text-sky-300 underline hover:text-sky-200 disabled:opacity-50"
                    disabled={!token || !!downloadingEmailsCode}
                    onClick={() => {
                      if (!token) return;
                      setDownloadingEmailsCode(r.code);
                      setError(null);
                      void (async () => {
                        try {
                          const mailReq: RequestInit = {
                            headers: { Authorization: `Bearer ${token}` },
                          };
                          const res = await fetch(
                            apiUrl(`/admin/campaigns/${encodeURIComponent(r.code)}/vote-emails`),
                            mailReq,
                          );
                          redirectIfSessionExpired(res, mailReq);
                          if (!res.ok) throw new Error(await res.text());
                          const blob = await res.blob();
                          const href = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = href;
                          a.download = `${r.code}-vote-emails.csv`;
                          a.rel = "noopener";
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                          URL.revokeObjectURL(href);
                        } catch {
                          setError("メールアドレス一覧のダウンロードに失敗しました");
                        } finally {
                          setDownloadingEmailsCode(null);
                        }
                      })();
                    }}
                  >
                    {downloadingEmailsCode === r.code ? "取得中…" : "メールCSV"}
                  </button>
                  <button
                    type="button"
                    className="text-sm text-emerald-300 underline hover:text-emerald-200 disabled:opacity-50"
                    disabled={!token || resultsLoading}
                    onClick={() => {
                      if (!token) return;
                      setResultsForCode(r.code);
                      setResultsData(null);
                      setResultsError(null);
                      setResultsLoading(true);
                      void (async () => {
                        try {
                          const data = await apiGet<CampaignVoteResults>(
                            `/admin/campaigns/${encodeURIComponent(r.code)}/vote-results`,
                            { headers: { Authorization: `Bearer ${token}` } },
                          );
                          setResultsData(data);
                        } catch {
                          setResultsError("結果の取得に失敗しました");
                        } finally {
                          setResultsLoading(false);
                        }
                      })();
                    }}
                  >
                    結果
                  </button>
                  <Link
                    className="text-indigo-300 underline"
                    href={`/${encodeURIComponent(r.code)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    LPを開く
                  </Link>
                  <button
                    type="button"
                    className="text-sm text-rose-300 underline hover:text-rose-200 disabled:opacity-50"
                    disabled={!token || deletingCode === r.code}
                    onClick={async () => {
                      if (!token) return;
                      if (!window.confirm(`企画「${r.name}」（${r.code}）を削除しますか？\nこの操作は取り消せません。`)) {
                        return;
                      }
                      setDeletingCode(r.code);
                      setError(null);
                      try {
                        await apiDelete<{ ok: boolean }>(
                          `/admin/campaigns/${encodeURIComponent(r.code)}`,
                          { headers: { Authorization: `Bearer ${token}` } },
                        );
                        await loadCampaignPage(page);
                      } catch {
                        setError("削除に失敗しました");
                      } finally {
                        setDeletingCode(null);
                      }
                    }}
                  >
                    {deletingCode === r.code ? "削除中…" : "削除"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {resultsForCode ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="vote-results-title"
        >
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-xl">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-800 px-5 py-4">
              <div className="min-w-0">
                <h2 id="vote-results-title" className="text-lg font-semibold text-slate-50">
                  投票結果
                </h2>
                {resultsData ? (
                  <p className="mt-1 text-sm text-slate-400">
                    <span className="font-mono text-slate-200">{resultsData.campaign_code}</span>
                    {" · "}
                    {resultsData.campaign_name}
                    <span className="ml-2 text-slate-500">
                      （投票 {resultsData.total_ballots} 件）
                    </span>
                  </p>
                ) : (
                  <p className="mt-1 font-mono text-sm text-slate-500">{resultsForCode}</p>
                )}
              </div>
              <button
                type="button"
                className="shrink-0 rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
                onClick={() => {
                  setResultsForCode(null);
                  setResultsData(null);
                  setResultsError(null);
                }}
              >
                閉じる
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {resultsLoading ? (
                <p className="text-sm text-slate-400">読み込み中…</p>
              ) : resultsError ? (
                <p className="text-sm text-rose-300">{resultsError}</p>
              ) : resultsData && resultsData.items.length === 0 ? (
                <p className="text-sm text-slate-400">アイテムが登録されていません。</p>
              ) : resultsData ? (
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-left text-xs text-slate-500">
                      <th className="pb-2 pr-3 font-medium">画像</th>
                      <th className="pb-2 pr-3 font-medium">アイテム</th>
                      <th className="pb-2 font-medium">投票数</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {resultsData.items.map((it) => {
                      const src = it.image_url ? resolveMediaUrl(it.image_url) : "";
                      return (
                        <tr key={it.index}>
                          <td className="py-3 pr-3 align-middle">
                            {src ? (
                              <div className="w-[100px] shrink-0 overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={src}
                                  alt=""
                                  className="h-auto w-[100px] max-w-[100px] object-cover"
                                  width={100}
                                />
                              </div>
                            ) : (
                              <div className="flex h-[56px] w-[100px] items-center justify-center rounded-lg border border-slate-800 bg-slate-950 text-xs text-slate-600">
                                なし
                              </div>
                            )}
                          </td>
                          <td className="py-3 pr-3 align-middle text-slate-100">
                            <div className="font-medium">{it.name}</div>
                            <div className="font-mono text-xs text-slate-500">index {it.index}</div>
                          </td>
                          <td className="py-3 align-middle tabular-nums text-slate-100">
                            {it.vote_count}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {editingCode && token ? (
        <Modal title="企画編集" maxWidthClassName="max-w-6xl" onClose={() => setEditingCode(null)}>
          <CampaignEditPanel
            code={editingCode}
            token={token}
            onClose={() => setEditingCode(null)}
            onSaved={(u) => {
              setListData((prev) =>
                prev
                  ? {
                      ...prev,
                      items: prev.items.map((x) => (x.code === u.code ? { ...x, ...u } : x)),
                    }
                  : prev,
              );
            }}
          />
        </Modal>
      ) : null}

      {creatingOpen && token ? (
        <Modal title="企画新規登録" maxWidthClassName="max-w-6xl" onClose={() => setCreatingOpen(false)}>
          <CampaignCreatePanel
            token={token}
            onClose={() => setCreatingOpen(false)}
            onCreated={() => {
              setPage(1);
              void loadCampaignPage(1);
            }}
          />
        </Modal>
      ) : null}

      {campaignLimitModalText ? (
        <Modal title="企画の作成上限" onClose={() => setCampaignLimitModalText(null)} maxWidthClassName="max-w-md">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{campaignLimitModalText}</p>
        </Modal>
      ) : null}
    </main>
  );
}

