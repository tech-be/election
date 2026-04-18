"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { apiGet, type Campaign } from "../../../../../lib/api";

export default function AdminCampaignKeyTextPage() {
  const params = useParams<{ code: string }>();
  const code = params.code;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const c = await apiGet<Campaign>(`/campaigns/${encodeURIComponent(code)}`);
        setCampaign(c);
      } catch {
        setError("取得に失敗しました");
      } finally {
        setLoading(false);
      }
    })();
  }, [code]);

  return (
    <main className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400">管理画面</div>
          <h1 className="text-2xl font-semibold tracking-tight">KeyText</h1>
          <div className="mt-1 text-xs text-slate-400">
            企画コード: <span className="font-mono text-slate-200">{code}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200 hover:border-slate-500"
            href={`/admin/campaigns/${encodeURIComponent(code)}/edit`}
          >
            編集へ
          </Link>
          <a
            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200 hover:border-slate-500"
            href={`/${encodeURIComponent(code)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            LPを別TABで開く
          </a>
        </div>
      </header>

      {loading ? <div className="text-sm text-slate-300">読み込み中...</div> : null}

      {error ? (
        <div className="rounded-2xl border border-rose-800/60 bg-rose-950/20 p-4 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="text-sm text-slate-300">企画名</div>
        <div className="mt-1 text-lg font-semibold text-slate-100">
          {campaign?.name ?? "-"}
        </div>

        <div className="mt-6 text-sm text-slate-300">KeyText（コピー可）</div>
        <pre className="mt-2 whitespace-pre-wrap break-words rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-100">
          {campaign?.key_text?.length ? campaign.key_text : "（未登録）"}
        </pre>
      </section>
    </main>
  );
}

