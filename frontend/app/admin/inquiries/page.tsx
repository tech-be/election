"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  apiGet,
  apiPatch,
  type AdminInquiryListResponse,
  INQUIRY_STATUS_OPTIONS,
  type Inquiry,
  type InquiryStatus,
} from "../../../lib/api";
import { Modal } from "../../../components/admin/Modal";
import { useRedirectIfMissingAdminToken } from "../../../lib/useRedirectIfMissingAdminToken";

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
  }).format(d);
}

function normalizeInquiryStatus(raw: string | undefined | null): InquiryStatus {
  const s = (raw ?? "").trim();
  return (INQUIRY_STATUS_OPTIONS as readonly string[]).includes(s) ? (s as InquiryStatus) : "着信";
}

export default function AdminInquiriesPage() {
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [listData, setListData] = useState<AdminInquiryListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    setToken(localStorage.getItem("admin_token"));
  }, []);

  useRedirectIfMissingAdminToken(mounted, token);

  const loadPage = useCallback(async (t: string, p: number) => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({ page: String(p) });
      const data = await apiGet<AdminInquiryListResponse>(`/admin/inquiries?${q.toString()}`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      setListData(data);
    } catch {
      setListData(null);
      setError("問い合わせの取得に失敗しました（権限不足の可能性）");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    void loadPage(token, page);
  }, [token, page, loadPage]);

  useEffect(() => {
    if (!listData) return;
    if (page > listData.total_pages) {
      setPage(listData.total_pages);
    }
  }, [listData, page]);

  const patchStatus = useCallback(
    async (inquiryId: number, status: InquiryStatus) => {
      if (!token) return;
      setUpdatingStatusId(inquiryId);
      setError(null);
      try {
        const updated = await apiPatch<Inquiry>(`/admin/inquiries/${inquiryId}`, { status }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setListData((prev) =>
          prev
            ? {
                ...prev,
                items: prev.items.map((x) => (x.id === inquiryId ? { ...x, ...updated } : x)),
              }
            : prev,
        );
        setSelected((sel) => (sel?.id === inquiryId ? { ...sel, ...updated } : sel));
      } catch {
        setError("状態の更新に失敗しました");
      } finally {
        setUpdatingStatusId(null);
      }
    },
    [token],
  );

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

  const statusSelectClass =
    "max-w-[10rem] rounded-lg border border-slate-600 bg-slate-950 px-2 py-1.5 text-sm text-slate-100 outline-none focus:border-indigo-400 disabled:opacity-50";

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="text-xs text-slate-400">問い合わせ確認</div>
        <h1 className="text-2xl font-semibold tracking-tight">問い合わせ一覧</h1>
      </header>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-300">
            {loading ? (
              "読み込み中…"
            ) : listData ? (
              <>
                全 {listData.total} 件 · 1ページ {listData.page_size} 件 · ページ {listData.page} / {listData.total_pages}
              </>
            ) : (
              "—"
            )}
            {error ? <span className="ml-3 text-rose-300">{error}</span> : null}
          </div>
          <button
            type="button"
            disabled={!token || loading}
            className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-slate-500 disabled:opacity-50"
            onClick={() => {
              if (!token) return;
              void loadPage(token, page);
            }}
          >
            更新
          </button>
        </div>

        {totalPages > 1 ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
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

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-xs text-slate-400">
                <th className="border-b border-slate-800 px-3 py-2">ID</th>
                <th className="border-b border-slate-800 px-3 py-2">日時</th>
                <th className="border-b border-slate-800 px-3 py-2 whitespace-nowrap">状態</th>
                <th className="border-b border-slate-800 px-3 py-2">お名前</th>
                <th className="border-b border-slate-800 px-3 py-2">メール</th>
                <th className="border-b border-slate-800 px-3 py-2">本文</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && !loading ? (
                <tr>
                  <td className="px-3 py-6 text-sm text-slate-500" colSpan={6}>
                    問い合わせはまだありません。
                  </td>
                </tr>
              ) : rows.length === 0 && loading ? (
                <tr>
                  <td className="px-3 py-6 text-sm text-slate-400" colSpan={6}>
                    読み込み中…
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr
                    key={r.id}
                    className="cursor-pointer text-sm text-slate-200 hover:bg-slate-950/40"
                    onClick={() => setSelected(r)}
                  >
                    <td className="border-b border-slate-800 px-3 py-3 font-mono">{r.id}</td>
                    <td className="border-b border-slate-800 px-3 py-3">{fmt(r.created_at)}</td>
                    <td
                      className="border-b border-slate-800 px-3 py-3 align-middle"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <select
                        className={statusSelectClass}
                        aria-label={`問い合わせ ${r.id} の状態`}
                        value={normalizeInquiryStatus(r.status)}
                        disabled={!token || updatingStatusId === r.id}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const v = e.target.value as InquiryStatus;
                          void patchStatus(r.id, v);
                        }}
                      >
                        {INQUIRY_STATUS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border-b border-slate-800 px-3 py-3">{(r.name || "").trim() || "（未入力）"}</td>
                    <td className="border-b border-slate-800 px-3 py-3">{r.email}</td>
                    <td className="border-b border-slate-800 px-3 py-3 text-slate-300">
                      {String(r.message || "").slice(0, 60)}
                      {String(r.message || "").length > 60 ? "…" : ""}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selected ? (
        <Modal
          title={`問い合わせ #${selected.id}`}
          onClose={() => setSelected(null)}
          maxWidthClassName="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="text-xs text-slate-400">日時</div>
                <div className="mt-1 text-sm text-slate-100">{fmt(selected.created_at)}</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="text-xs text-slate-400">メール</div>
                <div className="mt-1 break-all text-sm text-slate-100">{selected.email}</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 sm:col-span-2">
                <div className="text-xs text-slate-400">状態</div>
                <div className="mt-2 max-w-xs" onClick={(e) => e.stopPropagation()}>
                  <select
                    className={`${statusSelectClass} w-full max-w-none`}
                    aria-label="問い合わせの状態"
                    value={normalizeInquiryStatus(selected.status)}
                    disabled={!token || updatingStatusId === selected.id}
                    onChange={(e) => {
                      const v = e.target.value as InquiryStatus;
                      void patchStatus(selected.id, v);
                    }}
                  >
                    {INQUIRY_STATUS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 sm:col-span-2">
                <div className="text-xs text-slate-400">お名前</div>
                <div className="mt-1 text-sm text-slate-100">{(selected.name || "").trim() || "（未入力）"}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
              <div className="text-xs text-slate-400">本文</div>
              <pre className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-100">{selected.message}</pre>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
