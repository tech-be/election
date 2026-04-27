"use client";

import Image from "next/image";
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
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-900/40 px-4 py-3">
            <div className="relative h-11 w-11 overflow-hidden rounded-xl bg-slate-950 ring-1 ring-slate-800">
              <Image
                src="/icon.png"
                alt="Aquirise"
                fill
                sizes="44px"
                className="object-cover"
                priority
              />
            </div>
            <div className="leading-tight">
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-semibold tracking-[0.08em] text-slate-50">Aquirise</div>
                <div className="text-xs font-medium tracking-wide text-slate-300">アキライズ</div>
              </div>
              <div className="mt-1 text-xs leading-snug text-slate-300">
                『選ぶ』を『絆』に変えるリワード型エンゲージメント
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h1 className="mb-4 text-lg font-semibold tracking-tight text-slate-200">ログイン</h1>
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

