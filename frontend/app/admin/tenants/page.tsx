"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiGet, apiPatch, apiPost, type Tenant } from "../../../lib/api";

export default function AdminTenantsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingCouponsId, setUpdatingCouponsId] = useState<number | null>(null);

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
              <li key={t.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="truncate font-medium text-slate-100">{t.name}</div>
                  <div className="text-xs text-slate-500">ID: {t.id}</div>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                    <span className="whitespace-nowrap text-slate-400">クーポン機能</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={t.coupons_enabled}
                      disabled={!token || updatingCouponsId === t.id}
                      className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                        t.coupons_enabled ? "bg-emerald-600" : "bg-slate-600"
                      } disabled:opacity-50`}
                      onClick={() => {
                        if (!token || updatingCouponsId !== null) return;
                        const next = !t.coupons_enabled;
                        setUpdatingCouponsId(t.id);
                        setError(null);
                        void (async () => {
                          try {
                            const updated = await apiPatch<Tenant>(
                              `/admin/tenants/${t.id}`,
                              { coupons_enabled: next },
                              { headers: { Authorization: `Bearer ${token}` } },
                            );
                            setTenants((prev) => prev.map((x) => (x.id === t.id ? updated : x)));
                          } catch {
                            setError("クーポン設定の更新に失敗しました");
                          } finally {
                            setUpdatingCouponsId(null);
                          }
                        })();
                      }}
                    >
                      <span
                        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                          t.coupons_enabled ? "left-5" : "left-0.5"
                        }`}
                      />
                    </button>
                    <span className="text-xs text-slate-500">
                      {updatingCouponsId === t.id ? "更新中…" : t.coupons_enabled ? "利用可" : "オフ"}
                    </span>
                  </label>
                  <Link
                    className="shrink-0 rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900"
                    href={`/admin/tenants/${t.id}`}
                  >
                    ユーザ管理
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
