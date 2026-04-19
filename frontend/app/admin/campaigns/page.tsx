"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiDelete, apiGet, type Campaign, type CampaignVoteResults } from "../../../lib/api";
import { resolveMediaUrl } from "../../../lib/products";

type TenantRow = { id: number; name: string };

export default function AdminCampaignsPage() {
  const [rows, setRows] = useState<Campaign[]>([]);
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
        const data = await apiGet<Campaign[]>("/admin/campaigns", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRows(data);
      } catch {
        setError("取得に失敗しました");
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

  return (
    <main className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400">管理画面</div>
          <h1 className="text-2xl font-semibold tracking-tight">企画一覧</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
            href="/admin/campaigns/new"
          >
            企画新規登録
          </Link>
        </div>
      </header>

      {mounted && !token ? (
        <div className="rounded-2xl border border-rose-800/60 bg-rose-950/20 p-4 text-sm text-rose-200">
          ログイン情報がありません。先に <Link className="underline" href="/admin/login">ログイン</Link> してください。
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-800/60 bg-rose-950/20 p-4 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-slate-800">
        <div className="grid grid-cols-12 gap-0 bg-slate-900/50 px-4 py-3 text-xs text-slate-300">
          {role === "sysadmin" ? <div className="col-span-3">テナント</div> : null}
          <div className={role === "sysadmin" ? "col-span-2" : "col-span-3"}>コード</div>
          <div className={role === "sysadmin" ? "col-span-3" : "col-span-5"}>名称</div>
          <div className="col-span-4">操作</div>
        </div>
        <div className="divide-y divide-slate-800 bg-slate-950/40">
          {rows.length === 0 ? (
            <div className="px-4 py-6 text-sm text-slate-300">
              企画がありません
            </div>
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
                <div className={role === "sysadmin" ? "col-span-3 text-slate-100" : "col-span-5 text-slate-100"}>
                  {r.name}
                </div>
                <div className="col-span-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <Link
                    className="text-slate-200 underline hover:text-white"
                    href={`/admin/campaigns/${encodeURIComponent(r.code)}/edit`}
                  >
                    編集
                  </Link>
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
                        setRows((prev) => prev.filter((x) => x.code !== r.code));
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
    </main>
  );
}

