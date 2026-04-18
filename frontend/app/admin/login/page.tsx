"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiPost } from "../../../lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen px-4 py-10">
    <main className="mx-auto max-w-md space-y-6">
      <header className="space-y-2">
        <div className="text-xs text-slate-400">管理画面</div>
        <h1 className="text-2xl font-semibold tracking-tight">ログイン</h1>
      </header>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <label className="block text-sm text-slate-200">
          メールアドレス
          <input
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
          />
        </label>
        <label className="block text-sm text-slate-200">
          パスワード
          <input
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
          />
        </label>
        {error ? (
          <div className="mt-3 text-sm text-rose-300">{error}</div>
        ) : null}
        <button
          className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
          disabled={loading || password.length === 0}
          onClick={async () => {
            setLoading(true);
            setError(null);
            try {
              const res = await apiPost<{ token: string; role?: string | null; tenant_id?: number | null }>(
                "/admin/login",
                {
                ...(email.trim().length > 0 ? { email: email.trim() } : {}),
                password,
                },
              );
              localStorage.setItem("admin_token", res.token);
              const roleNorm = String(res.role ?? "")
                .trim()
                .toLowerCase();
              const roleStored =
                roleNorm === "sysadmin" || roleNorm === "tenant" || roleNorm === "user" ? roleNorm : "";
              localStorage.setItem("admin_role", roleStored);
              localStorage.setItem("admin_tenant_id", String(res.tenant_id ?? ""));
              if (roleStored === "sysadmin") {
                router.push("/admin/tenants");
              } else {
                router.push("/admin/campaigns");
              }
            } catch (e) {
              setError("ログインに失敗しました");
            } finally {
              setLoading(false);
            }
          }}
        >
          ログイン
        </button>
      </div>
    </main>
    </div>
  );
}

