"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";

import { apiPostWithStatus, type PublicTenantRegisterResponse } from "../../lib/api";

function apiErrorDetail(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const d = (body as { detail?: unknown }).detail;
  if (typeof d === "string") return d;
  return null;
}

export default function RegisterPage() {
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<PublicTenantRegisterResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const canSubmit = useMemo(() => {
    return companyName.trim().length > 0 && email.trim().length > 0 && !submitting;
  }, [companyName, email, submitting]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto w-full max-w-[828px] bg-sky-100 px-4 py-10">
          <main className="space-y-8">
            <header className="space-y-4">
              <div className="flex justify-end">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
                >
                  戻る
                </Link>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
                  <Image src="/icon.png" alt="Aquirise" fill sizes="56px" className="object-cover" priority />
                </div>
                <div>
                  <div className="text-sm font-medium tracking-wide text-slate-600">
                    <span className="font-display font-semibold tracking-[0.08em] text-slate-900">Aquirise</span>{" "}
                    <span className="text-slate-500">新規登録</span>
                  </div>
                  <h1 className="text-[26px] font-semibold leading-snug tracking-tight sm:text-[27px]">
                    アカウント登録
                  </h1>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-slate-600">
                会社名とメールアドレスをご入力ください。テナント（会社単位のワークスペース）と、テナント管理権限のユーザーが作成されます。パスワードは自動発行され、登録完了後にのみ表示されます。
              </p>
            </header>

            {success ? (
              <section className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-slate-900">登録が完了しました</h2>
                  <p className="text-sm leading-relaxed text-slate-600">
                    以下のパスワードは<strong className="font-semibold text-slate-800">再表示できません</strong>
                    。必ずコピーまたはメモして保管してください。ログイン画面ではメールアドレスとこのパスワードをご利用ください。
                  </p>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">ログインメール</div>
                    <div className="mt-1 font-mono text-sm text-slate-900">{success.email}</div>
                    <div className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                      自動発行パスワード（12文字）
                    </div>
                    <div className="mt-1 break-all font-mono text-base font-semibold tracking-wide text-slate-900">
                      {success.password}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-400"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(success.password);
                          setCopied(true);
                          window.setTimeout(() => setCopied(false), 2000);
                        } catch {
                          setCopied(false);
                        }
                      }}
                    >
                      {copied ? "コピーしました" : "パスワードをコピー"}
                    </button>
                    <Link
                      href="/admin/login"
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                    >
                      ログイン画面へ
                    </Link>
                  </div>
                </div>
              </section>
            ) : (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="space-y-5">
                  <label className="block text-sm text-slate-700">
                    会社名（必須）
                    <input
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-indigo-400"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="例：株式会社サンプル"
                      autoComplete="organization"
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
                      maxLength={254}
                    />
                  </label>

                  {error ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                      {error}
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                    <button
                      type="button"
                      disabled={!canSubmit}
                      className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
                      onClick={async () => {
                        setSubmitting(true);
                        setError(null);
                        try {
                          const { res, data } = await apiPostWithStatus<PublicTenantRegisterResponse>(
                            "/public/register-tenant",
                            {
                              company_name: companyName.trim(),
                              email: email.trim(),
                            },
                          );
                          if (!res.ok) {
                            const detail = apiErrorDetail(data);
                            if (res.status === 409 && detail === "email already registered") {
                              setError("このメールアドレスは既に登録されています。");
                            } else if (detail) {
                              setError(detail);
                            } else {
                              setError("登録に失敗しました。入力内容をご確認ください。");
                            }
                            return;
                          }
                          if (!data.ok || !data.password) {
                            setError("登録に失敗しました。しばらく経ってからお試しください。");
                            return;
                          }
                          setSuccess(data);
                        } catch {
                          setError("登録に失敗しました。通信環境をご確認ください。");
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                    >
                      {submitting ? "登録中…" : "登録する"}
                    </button>
                  </div>
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
