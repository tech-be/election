"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";

import { apiPost } from "../../lib/api";

type InquiryResponse = { ok: boolean; id: number };

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sentId, setSentId] = useState<number | null>(null);
  const [thanksOpen, setThanksOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSend = useMemo(() => {
    return email.trim().length > 0 && message.trim().length > 0 && !sending;
  }, [email, message, sending]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto w-full max-w-[828px] bg-sky-100 px-4 py-10">
          <main className="space-y-8">
            <header className="space-y-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
              >
                <span className="text-slate-500">←</span> サービス紹介に戻る
              </Link>
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
                  <Image src="/icon.png" alt="Aquirise" fill sizes="56px" className="object-cover" priority />
                </div>
                <div>
                  <div className="text-sm font-medium tracking-wide text-slate-600">
                    <span className="font-display font-semibold tracking-[0.08em] text-slate-900">Aquirise</span>{" "}
                    <span className="text-slate-500">お問い合わせ</span>
                  </div>
                  <h1 className="text-[26px] font-semibold leading-snug tracking-tight sm:text-[27px]">
                    お問い合わせフォーム
                  </h1>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-slate-600">
                ご相談・ご質問を受け付けています。内容を確認のうえ、担当よりご連絡いたします。
              </p>
            </header>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm text-slate-700">
                    お名前（任意）
                    <input
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-indigo-400"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="例：山田 太郎"
                      autoComplete="name"
                      maxLength={200}
                    />
                  </label>
                  <label className="block text-sm text-slate-700">
                    メールアドレス（必須）
                    <input
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-indigo-400"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@company.com"
                      autoComplete="email"
                      inputMode="email"
                    />
                  </label>
                </div>

                <label className="block text-sm text-slate-700">
                  お問い合わせ内容（必須）
                  <textarea
                    className="mt-2 min-h-40 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-indigo-400"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="ご相談内容をご記入ください"
                    maxLength={5000}
                  />
                  <div className="mt-1 text-xs text-slate-500">{message.length}/5000</div>
                </label>

                {error ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                    {error}
                  </div>
                ) : null}

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <button
                    type="button"
                    disabled={!canSend}
                    className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
                    onClick={async () => {
                      setSending(true);
                      setError(null);
                      try {
                        const res = await apiPost<InquiryResponse>("/public/inquiries", {
                          name: name.trim(),
                          email: email.trim(),
                          message: message.trim(),
                        });
                        setSentId(res.id);
                        setThanksOpen(true);
                      } catch {
                        setError("送信に失敗しました。入力内容をご確認ください。");
                      } finally {
                        setSending(false);
                      }
                    }}
                  >
                    {sending ? "送信中…" : "送信する"}
                  </button>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>

      {thanksOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="space-y-3 text-center">
              <div className="text-lg font-semibold text-slate-900">お問い合わせありがとうございました</div>
              <div className="text-sm leading-relaxed text-slate-600">
                担当よりご連絡をいたします。しばらくお待ちください。
              </div>
            </div>
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-400"
                onClick={() => {
                  setThanksOpen(false);
                  setName("");
                  setEmail("");
                  setMessage("");
                  setSentId(null);
                  setError(null);
                }}
              >
                戻る
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

