"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiGet, apiPost } from "../../../lib/api";

type Tenant = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
};

export default function AdminTenantsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setToken(localStorage.getItem("admin_token"));
  }, []);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await apiGet<Tenant[]>("/admin/tenants", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTenants(rows);
      } catch {
        setError("取得に失敗しました（権限不足の可能性）");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  return (
    <main className="w-full max-w-none space-y-6">
      <header className="space-y-2">
        <div className="text-xs text-slate-400">管理画面（シスアド）</div>
        <h1 className="text-2xl font-semibold tracking-tight">テナント管理</h1>
      </header>

      {mounted && !token ? (
        <div className="rounded-2xl border border-rose-800/60 bg-rose-950/20 p-4 text-sm text-rose-200">
          ログイン情報がありません。先にログインしてください。
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-800/60 bg-rose-950/20 p-4 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="text-sm font-medium text-slate-200">テナント作成</div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 text-sm text-slate-200">
            テナント名
            <input
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例）株式会社〇〇"
            />
          </label>
          <button
            type="button"
            className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
            disabled={!token || creating || name.trim().length === 0}
            onClick={async () => {
              if (!token) return;
              setCreating(true);
              setError(null);
              try {
                const t = await apiPost<Tenant>(
                  "/admin/tenants",
                  { name: name.trim() },
                  { headers: { Authorization: `Bearer ${token}` } },
                );
                setTenants((prev) => [t, ...prev]);
                setName("");
              } catch {
                setError("作成に失敗しました");
              } finally {
                setCreating(false);
              }
            }}
          >
            {creating ? "作成中…" : "作成"}
          </button>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium text-slate-200">テナント一覧</div>
          {loading ? <div className="text-xs text-slate-400">読み込み中…</div> : null}
        </div>
        {tenants.length === 0 && !loading ? (
          <div className="text-sm text-slate-400">まだありません</div>
        ) : (
          <ul className="divide-y divide-slate-800">
            {tenants.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="truncate font-medium text-slate-100">{t.name}</div>
                  <div className="text-xs text-slate-500">ID: {t.id}</div>
                </div>
                <Link
                  className="shrink-0 rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900"
                  href={`/admin/tenants/${t.id}`}
                >
                  ユーザ管理
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

