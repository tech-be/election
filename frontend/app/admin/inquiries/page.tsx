"use client";

import { useEffect, useMemo, useState } from "react";

import { apiGet, type Inquiry } from "../../../lib/api";
import { Modal } from "../../../components/admin/Modal";

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

export default function AdminInquiriesPage() {
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [rows, setRows] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Inquiry | null>(null);

  useEffect(() => {
    setMounted(true);
    setToken(localStorage.getItem("admin_token"));
  }, []);

  const refresh = async (t: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<Inquiry[]>("/admin/inquiries", {
        headers: { Authorization: `Bearer ${t}` },
      });
      setRows(data);
    } catch {
      setRows([]);
      setError("問い合わせの取得に失敗しました（権限不足の可能性）");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    void refresh(token);
  }, [token]);

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  }, [rows]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="text-xs text-slate-400">問い合わせ確認</div>
        <h1 className="text-2xl font-semibold tracking-tight">問い合わせ一覧</h1>
      </header>

      {mounted && !token ? (
        <div className="rounded-2xl border border-rose-800/60 bg-rose-950/20 p-4 text-sm text-rose-200">
          ログイン情報がありません。先にログインしてください。
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-300">
            {loading ? "読み込み中…" : `全 ${sorted.length} 件`}
            {error ? <span className="ml-3 text-rose-300">{error}</span> : null}
          </div>
          <button
            type="button"
            disabled={!token || loading}
            className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-slate-500 disabled:opacity-50"
            onClick={() => {
              if (!token) return;
              void refresh(token);
            }}
          >
            更新
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-xs text-slate-400">
                <th className="border-b border-slate-800 px-3 py-2">ID</th>
                <th className="border-b border-slate-800 px-3 py-2">日時</th>
                <th className="border-b border-slate-800 px-3 py-2">お名前</th>
                <th className="border-b border-slate-800 px-3 py-2">メール</th>
                <th className="border-b border-slate-800 px-3 py-2">本文</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td className="px-3 py-6 text-sm text-slate-500" colSpan={5}>
                    問い合わせはまだありません。
                  </td>
                </tr>
              ) : (
                sorted.map((r) => (
                  <tr
                    key={r.id}
                    className="cursor-pointer text-sm text-slate-200 hover:bg-slate-950/40"
                    onClick={() => setSelected(r)}
                  >
                    <td className="border-b border-slate-800 px-3 py-3 font-mono">{r.id}</td>
                    <td className="border-b border-slate-800 px-3 py-3">{fmt(r.created_at)}</td>
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

