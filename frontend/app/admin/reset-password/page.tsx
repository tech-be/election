"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { apiPost } from "../../../lib/api";
import { formatUserSaveApiError } from "../../../lib/formatApiError";
import { registrationPasswordViolation } from "../../../lib/userCredentials";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = (searchParams.get("token") ?? "").trim();

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-300">
        <p>再設定用のリンクが無効です。URL をご確認ください。</p>
        <Link href="/admin/forgot-password" className="mt-4 inline-block font-medium text-indigo-400 hover:underline">
          パスワード再設定の申請へ
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-emerald-300">
        <p>パスワードを更新しました。ログイン画面からお入りください。</p>
        <button
          type="button"
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
          onClick={() => router.push("/admin/login")}
        >
          ログインへ
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
      <p className="text-sm leading-relaxed text-slate-300">新しいパスワードを入力して確定してください。</p>
      <label className="mt-4 block text-sm text-slate-200">
        新しいパスワード
        <input
          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        <span className="mt-1 block text-xs text-slate-500">英数記号を組み合わせ最低8文字以上</span>
      </label>
      <label className="mt-4 block text-sm text-slate-200">
        新しいパスワード（確認）
        <input
          className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400"
          type="password"
          autoComplete="new-password"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          disabled={loading}
        />
      </label>
      {error ? <div className="mt-3 text-sm text-rose-300">{error}</div> : null}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-between">
        <Link
          href="/admin/login"
          className="inline-flex items-center justify-center rounded-xl border border-slate-600 px-4 py-2 text-center text-sm font-semibold text-slate-200 hover:bg-slate-800"
        >
          キャンセル
        </Link>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
          disabled={loading || password.length === 0}
          onClick={async () => {
            const v = registrationPasswordViolation(password);
            if (v) {
              setError(v);
              return;
            }
            if (password !== password2) {
              setError("確認用のパスワードが一致しません。");
              return;
            }
            setLoading(true);
            setError(null);
            try {
              await apiPost<{ ok?: boolean }>("/public/password-reset/complete", {
                token,
                new_password: password,
              });
              setDone(true);
            } catch (e) {
              setError(formatUserSaveApiError(e, "パスワードの更新に失敗しました。リンクの有効期限をご確認ください。"));
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? "更新中…" : "パスワードを確定"}
        </button>
      </div>
    </div>
  );
}

export default function AdminResetPasswordPage() {
  return (
    <div className="min-h-screen px-4 py-10">
      <main className="mx-auto max-w-md space-y-6">
        <header className="flex items-center justify-center">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-900/40 px-4 py-3">
            <div className="relative h-11 w-11 overflow-hidden rounded-xl bg-slate-950 ring-1 ring-slate-800">
              <Image src="/icon.png" alt="Aquirise" fill sizes="44px" className="object-cover" priority />
            </div>
            <div className="leading-tight">
              <div className="text-xl font-semibold tracking-[0.08em] text-slate-50">Aquirise</div>
              <div className="mt-0.5 text-xs text-slate-400">パスワードの再設定</div>
            </div>
          </div>
        </header>
        <Suspense
          fallback={
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
              読み込み中…
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </main>
    </div>
  );
}
