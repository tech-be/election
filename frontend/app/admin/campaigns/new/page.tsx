"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { CampaignCreatePanel } from "../../../../components/admin/CampaignCreatePanel";

export default function AdminCampaignNewPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setToken(localStorage.getItem("admin_token"));
  }, []);

  return (
    <main className="w-full max-w-none space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400">管理画面</div>
          <h1 className="text-2xl font-semibold tracking-tight">企画新規登録</h1>
        </div>
        <button
          type="button"
          className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200 hover:border-slate-500"
          onClick={() => router.push("/admin/campaigns")}
        >
          一覧へ戻る
        </button>
      </header>

      {mounted ? (
        <CampaignCreatePanel token={token} onClose={() => router.push("/admin/campaigns")} />
      ) : null}
    </main>
  );
}
