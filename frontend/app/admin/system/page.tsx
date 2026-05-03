"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useRedirectIfMissingAdminToken } from "../../../lib/useRedirectIfMissingAdminToken";
import { OperationHistoryPanel } from "./OperationHistoryPanel";
import { TenantSummaryPanel } from "./TenantSummaryPanel";

const SYSTEM_TABS = [
  { id: "history" as const, label: "履歴" },
  { id: "summary" as const, label: "集計" },
];

export default function AdminSystemPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string>("");
  const [tab, setTab] = useState<(typeof SYSTEM_TABS)[number]["id"]>("history");

  useEffect(() => {
    setMounted(true);
    setToken(localStorage.getItem("admin_token"));
    setRole((localStorage.getItem("admin_role") ?? "").trim().toLowerCase());
  }, []);

  useRedirectIfMissingAdminToken(mounted, token);

  useEffect(() => {
    if (!mounted) return;
    if (role && role !== "sysadmin") {
      router.replace("/admin/campaigns");
    }
  }, [mounted, role, router]);

  if (!mounted || role !== "sysadmin") {
    return (
      <div className="space-y-6">
        <div className="text-sm text-slate-400">{!mounted ? "読み込み中…" : "権限を確認しています…"}</div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="space-y-6">
        <div className="text-sm text-slate-400">トークンを読み込み中…</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 pb-2">
      <header className="shrink-0 space-y-2">
        <div className="text-xs text-slate-400">システム管理</div>
        <h1 className="text-2xl font-semibold tracking-tight">システム管理</h1>
      </header>

      <div className="mb-1 flex shrink-0 flex-wrap gap-1 border-b border-slate-800 pb-0" role="tablist" aria-label="システム管理">
        {SYSTEM_TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={[
                "relative -mb-px rounded-t-lg border px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "border-slate-700 border-b-transparent bg-slate-900/40 text-indigo-100"
                  : "border-transparent text-slate-400 hover:text-slate-200",
              ].join(" ")}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden" role="tabpanel">
        {tab === "history" ? <OperationHistoryPanel token={token} /> : <TenantSummaryPanel token={token} />}
      </div>
    </div>
  );
}
