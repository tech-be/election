"use client";

import { useEffect, useMemo, useState } from "react";

import { apiGet, type AdminOperationLogListResponse } from "../../../lib/api";

function fmt(iso: string | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(d);
}

function roleJa(role: string | null | undefined) {
  if (!role) return "—";
  if (role === "sysadmin") return "シスアド";
  if (role === "tenant") return "テナント権限";
  if (role === "user") return "ユーザ権限";
  return role;
}

const LEGACY_DETAIL_PREFIX = "[legacy_sysadmin]";

function isLegacySysadminDetail(detail: string | null | undefined) {
  if (!detail) return false;
  if (detail === "legacy_sysadmin") return true;
  return detail.startsWith(LEGACY_DETAIL_PREFIX);
}

function roleColumn(row: AdminOperationLogListResponse["items"][number]) {
  if (isLegacySysadminDetail(row.detail)) return "シスアド";
  return roleJa(row.user_role);
}

function actorLabel(row: AdminOperationLogListResponse["items"][number]) {
  if (isLegacySysadminDetail(row.detail)) return "シスアド";
  if (row.user_email && row.user_email.trim()) return row.user_email.trim();
  return "—";
}

function detailDisplay(detail: string | null) {
  if (!detail) return "—";
  if (detail === "legacy_sysadmin") return "—";
  if (detail === LEGACY_DETAIL_PREFIX) return "—";
  if (detail.startsWith(`${LEGACY_DETAIL_PREFIX}\n`)) {
    const rest = detail.slice(LEGACY_DETAIL_PREFIX.length + 1).trim();
    return rest || "—";
  }
  return detail.trim() || "—";
}

export function OperationHistoryPanel({ token }: { token: string }) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminOperationLogListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (t: string, p: number) => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({ page: String(p) });
      const res = await apiGet<AdminOperationLogListResponse>(`/admin/operation-logs?${q.toString()}`, {
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

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
      <h2 className="sr-only">操作履歴</h2>
      <p className="shrink-0 text-sm text-slate-400">
        ログイン成功、メールアドレス一覧CSV・投票結果・クーポン発行一覧CSV のダウンロード／参照（GET が成功した場合）、および管理画面からの変更操作（POST
        / PATCH / PUT / DELETE が成功した場合）を記録しています。一覧ページを開くだけの GET
        は対象外です。「API名」はバックエンドで処理したハンドラの関数名です。詳細列には GET のクエリ、またはマスク済みのリクエストボディ（ファイルアップロードのバイナリは記録しません）を表示します。新しい順です。
      </p>

      <div className="mt-4 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-300">
          {loading ? (
            "読み込み中…"
          ) : data ? (
            <>
              全 {data.total} 件 · 1ページ {data.page_size} 件 · ページ {data.page} / {data.total_pages}
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
              <th className="border-b border-slate-800 px-3 py-2 whitespace-nowrap">日時</th>
              <th className="border-b border-slate-800 px-3 py-2">操作者</th>
              <th className="border-b border-slate-800 px-3 py-2 whitespace-nowrap">権限</th>
              <th className="border-b border-slate-800 px-3 py-2">画面（パス）</th>
              <th className="border-b border-slate-800 px-3 py-2 whitespace-nowrap">API名</th>
              <th className="border-b border-slate-800 px-3 py-2">操作</th>
              <th className="border-b border-slate-800 px-3 py-2">詳細</th>
            </tr>
          </thead>
          <tbody>
            {!data || data.items.length === 0 ? (
              <tr>
                <td className="px-3 py-8 text-sm text-slate-500" colSpan={7}>
                  {loading ? "読み込み中…" : "まだ記録がありません。管理画面で変更操作を行うとここに表示されます。"}
                </td>
              </tr>
            ) : (
              data.items.map((r) => (
                <tr key={r.id} className="text-sm text-slate-200">
                  <td className="border-b border-slate-800 px-3 py-3 whitespace-nowrap align-top text-slate-300">
                    {fmt(r.created_at)}
                  </td>
                  <td className="border-b border-slate-800 px-3 py-3 align-top break-all">{actorLabel(r)}</td>
                  <td className="border-b border-slate-800 px-3 py-3 align-top whitespace-nowrap text-slate-300">
                    {roleColumn(r)}
                  </td>
                  <td className="border-b border-slate-800 px-3 py-3 align-top font-mono text-xs text-slate-300">
                    {r.screen}
                  </td>
                  <td className="border-b border-slate-800 px-3 py-3 align-top font-mono text-xs text-slate-300">
                    {r.api_name ?? "—"}
                  </td>
                  <td className="border-b border-slate-800 px-3 py-3 align-top font-mono text-xs text-slate-300">
                    {r.operation}
                  </td>
                  <td className="border-b border-slate-800 px-3 py-3 align-top text-slate-400">
                    <div className="whitespace-pre-wrap break-words font-mono text-xs">{detailDisplay(r.detail)}</div>
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
