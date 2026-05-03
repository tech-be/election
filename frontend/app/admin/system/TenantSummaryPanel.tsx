"use client";

import { useEffect, useMemo, useState } from "react";

import { apiGet, type TenantSummaryListResponse } from "../../../lib/api";

const nf = new Intl.NumberFormat("ja-JP");

export function TenantSummaryPanel({ token }: { token: string }) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<TenantSummaryListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (t: string, p: number) => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({ page: String(p) });
      const res = await apiGet<TenantSummaryListResponse>(`/admin/system/tenant-summary?${q.toString()}`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      setData(res);
    } catch {
      setData(null);
      setError("取得に失敗しました（シスアドのみ参照できます）");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(token, page);
  }, [token, page]);

  const totalPages = data?.total_pages ?? 1;
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

  const rows = data?.items ?? [];

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
      <h2 className="sr-only">テナント別集計</h2>
      <p className="shrink-0 text-sm text-slate-400">
        テナントごとの管理ユーザー数・企画数・投票参加（投票レコード件数）・クーポン登録数（Coupon マスタ件数）・クーポン利用者（利用済み発行のユニークメール数）です。
      </p>

      <div className="mt-4 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-300">
          {loading ? (
            "読み込み中…"
          ) : data ? (
            <>
              全 {data.total} テナント · 1ページ {data.page_size} 件 · ページ {data.page} / {data.total_pages}
            </>
          ) : (
            "—"
          )}
          {error ? <span className="ml-3 text-rose-300">{error}</span> : null}
        </div>
        <button
          type="button"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-slate-500 disabled:opacity-50"
          onClick={() => void load(token, page)}
        >
          更新
        </button>
      </div>

      {totalPages > 1 ? (
        <div className="mt-4 flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={loading || page <= 1}
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
                disabled={loading}
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
            disabled={loading || page >= totalPages}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 hover:border-slate-500 disabled:opacity-40"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            次へ
          </button>
        </div>
      ) : null}

      <div className="mt-4 min-h-0 flex-1 overflow-auto overscroll-contain">
        <table className="min-w-full border-separate border-spacing-0">
          <thead className="sticky top-0 z-[1] bg-slate-950/95 shadow-[0_1px_0_0_rgb(30_41_59)] backdrop-blur-sm">
            <tr className="text-left text-xs text-slate-400">
              <th className="border-b border-slate-800 px-3 py-2">テナント</th>
              <th className="border-b border-slate-800 px-3 py-2 whitespace-nowrap text-right">テナント権限数</th>
              <th className="border-b border-slate-800 px-3 py-2 whitespace-nowrap text-right">ユーザ権限数</th>
              <th className="border-b border-slate-800 px-3 py-2 whitespace-nowrap text-right">企画数</th>
              <th className="border-b border-slate-800 px-3 py-2 whitespace-nowrap text-right">企画参加者数</th>
              <th className="border-b border-slate-800 px-3 py-2 whitespace-nowrap text-right">クーポン登録数</th>
              <th className="border-b border-slate-800 px-3 py-2 whitespace-nowrap text-right">クーポン総利用者数</th>
            </tr>
          </thead>
          <tbody>
            {!data || rows.length === 0 ? (
              <tr>
                <td className="px-3 py-8 text-sm text-slate-500" colSpan={7}>
                  {loading ? "読み込み中…" : "テナントがありません。"}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.tenant_id} className="text-sm text-slate-200">
                  <td className="border-b border-slate-800 px-3 py-3 align-top font-medium text-slate-100">{r.tenant_name}</td>
                  <td className="border-b border-slate-800 px-3 py-3 text-right tabular-nums text-slate-300">
                    {nf.format(r.tenant_admin_count)}
                  </td>
                  <td className="border-b border-slate-800 px-3 py-3 text-right tabular-nums text-slate-300">
                    {nf.format(r.tenant_user_count)}
                  </td>
                  <td className="border-b border-slate-800 px-3 py-3 text-right tabular-nums text-slate-300">
                    {nf.format(r.campaign_count)}
                  </td>
                  <td className="border-b border-slate-800 px-3 py-3 text-right tabular-nums text-slate-300">
                    {nf.format(r.vote_participation_count)}
                  </td>
                  <td className="border-b border-slate-800 px-3 py-3 text-right tabular-nums text-slate-300">
                    {nf.format(r.coupon_count)}
                  </td>
                  <td className="border-b border-slate-800 px-3 py-3 text-right tabular-nums text-slate-300">
                    {nf.format(r.coupon_distinct_user_count)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
