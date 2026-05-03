"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Modal } from "../../../components/admin/Modal";
import { apiPost } from "../../../lib/api";
import { formatUserSaveApiError } from "../../../lib/formatApiError";
import { registrationEmailViolation } from "../../../lib/userCredentials";

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);
  const [sendErrorDialog, setSendErrorDialog] = useState<string | null>(null);

  return (
    <div className="min-h-screen px-4 py-10">
      <main className="mx-auto max-w-md space-y-6">
        <header className="space-y-2">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3 rounded-2xl bg-slate-900/40 px-4 py-3">
              <div className="relative h-11 w-11 overflow-hidden rounded-xl bg-slate-950 ring-1 ring-slate-800">
                <Image src="/icon.png" alt="Aquirise" fill sizes="44px" className="object-cover" priority />
              </div>
              <div className="leading-tight">
                <div className="text-xl font-semibold tracking-[0.08em] text-slate-50">Aquirise</div>
                <div className="mt-0.5 text-xs text-slate-400">パスワード再設定</div>
              </div>
            </div>
          </div>
        </header>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <p className="text-sm leading-relaxed text-slate-300">
            登録済みのメールアドレスを入力してください。再設定用のURLをメールでお送りします（発行から30分・1回限り有効）。
          </p>
          <label className="mt-4 block text-sm text-slate-200">
            メールアドレス
            <input
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-indigo-400"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              disabled={loading || doneMessage != null}
            />
          </label>
          {error ? <div className="mt-3 text-sm text-rose-300">{error}</div> : null}
          {doneMessage ? <div className="mt-3 text-sm text-emerald-300">{doneMessage}</div> : null}
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-between">
            <Link
              href="/admin/login"
              className="inline-flex items-center justify-center rounded-xl border border-slate-600 px-4 py-2 text-center text-sm font-semibold text-slate-200 hover:bg-slate-800"
            >
              ログインへ戻る
            </Link>
            {doneMessage ? null : (
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
                disabled={loading || email.trim().length === 0}
                onClick={async () => {
                  const em = email.trim().toLowerCase();
                  const v = registrationEmailViolation(em);
                  if (v) {
                    setError(v);
                    return;
                  }
                  setLoading(true);
                  setError(null);
                  setSendErrorDialog(null);
                  try {
                    const res = await apiPost<{ ok?: boolean; message?: string }>(
                      "/public/password-reset/request",
                      { email: em },
                    );
                    setDoneMessage(
                      typeof res.message === "string" && res.message.trim()
                        ? res.message.trim()
                        : "ご入力のメールアドレス宛に、パスワード再設定用の案内を送信しました。",
                    );
                  } catch (e) {
                    setSendErrorDialog(
                      formatUserSaveApiError(
                        e,
                        "パスワード再設定用メールの送信に失敗しました。時間をおいて再度お試しください。",
                      ),
                    );
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {loading ? "送信中…" : "送信する"}
              </button>
            )}
          </div>
        </div>
      </main>

      {sendErrorDialog ? (
        <Modal title="エラー" maxWidthClassName="max-w-md" onClose={() => setSendErrorDialog(null)}>
          <p className="whitespace-pre-wrap text-sm text-rose-200">{sendErrorDialog}</p>
        </Modal>
      ) : null}
    </div>
  );
}
