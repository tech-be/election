"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { type ReactNode, useCallback, useEffect, useState } from "react";

import { PopDecorations } from "../../../components/lp/PopDecorations";
import { apiGet, apiPost, type PublicCouponIssue } from "../../../lib/api";
import { lpBackgroundClassName } from "../../../lib/lpBackgrounds";
import { resolveMediaUrl } from "../../../lib/products";
import { lpFont } from "../../lpFont";

function CouponLpShell({
  children,
  narrow = true,
}: {
  children: ReactNode;
  narrow?: boolean;
}) {
  return (
    <div
      className={`${lpFont.className} ${lpBackgroundClassName("pastel_peach")} relative min-h-screen overflow-x-hidden`}
    >
      <PopDecorations />
      <div
        className={`relative z-10 mx-auto w-full px-4 pb-16 pt-10 sm:pt-14 ${narrow ? "max-w-lg" : "max-w-xl"}`}
      >
        {children}
      </div>
    </div>
  );
}

export default function CouponIssueLpPage() {
  const params = useParams<{ token: string }>();
  const raw = params?.token;
  const token = typeof raw === "string" ? raw : "";

  const [data, setData] = useState<PublicCouponIssue | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [useSubmitting, setUseSubmitting] = useState(false);
  const [useError, setUseError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoadError(null);
    try {
      const row = await apiGet<PublicCouponIssue>(`/public/coupon/${encodeURIComponent(token)}`);
      setData(row);
    } catch {
      setLoadError("このクーポンは見つかりませんでした。URL をご確認ください。");
      setData(null);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const onUse = useCallback(async () => {
    if (!token || !data || data.used) return;
    setUseSubmitting(true);
    setUseError(null);
    try {
      await apiPost<{ ok: boolean; used_at?: string | null }>(
        `/public/coupon/${encodeURIComponent(token)}/use`,
        {},
      );
      await load();
    } catch {
      setUseError("利用の記録に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setUseSubmitting(false);
    }
  }, [token, data, load]);

  if (!token) {
    return (
      <CouponLpShell>
        <div className="rounded-[2rem] border border-white/80 bg-white/85 px-8 py-12 text-center shadow-[0_24px_80px_rgba(244,114,182,0.15)] backdrop-blur-md">
          <p className="text-base font-medium text-slate-700">不正な URL です。</p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-pink-400 via-fuchsia-400 to-violet-500 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-fuchsia-500/25 transition hover:brightness-105"
          >
            トップへ
          </Link>
        </div>
      </CouponLpShell>
    );
  }

  if (loadError || !data) {
    return (
      <CouponLpShell>
        <div className="rounded-[2rem] border border-white/80 bg-white/85 px-8 py-12 text-center shadow-[0_24px_80px_rgba(244,114,182,0.15)] backdrop-blur-md">
          <p className="text-base font-medium text-slate-700">{loadError ?? "読み込み中…"}</p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-pink-400 via-fuchsia-400 to-violet-500 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-fuchsia-500/25 transition hover:brightness-105"
          >
            トップへ
          </Link>
        </div>
      </CouponLpShell>
    );
  }

  const imgSrc = data.image_url ? resolveMediaUrl(data.image_url) : "";

  return (
    <CouponLpShell narrow>
      <div className="space-y-5">
        <section className="rounded-[1.75rem] border border-white/80 bg-white/80 p-6 shadow-[0_20px_60px_rgba(167,139,250,0.12)] backdrop-blur-md">
          {data.used ? (
            <div
              className="mb-6 rounded-[1.5rem] border border-emerald-200/70 bg-gradient-to-br from-emerald-50/95 to-teal-50/90 px-5 py-5 text-center shadow-[0_16px_48px_rgba(52,211,153,0.15)]"
              role="status"
            >
              <p className="text-base font-extrabold text-emerald-900">このクーポンは利用済みです 🎉</p>
              {data.used_at ? (
                <p className="mt-2 text-xs font-medium text-emerald-800/85">
                  {new Date(data.used_at).toLocaleString("ja-JP")}
                </p>
              ) : null}
            </div>
          ) : null}

          <h2 className="mb-6 text-center text-2xl font-extrabold leading-snug tracking-tight text-slate-900 sm:text-3xl sm:leading-tight">
            特典を確認して、
            <br className="sm:hidden" />
            ご利用ください{" "}
            <span className="inline-block" aria-hidden>
              ✨
            </span>
          </h2>
          {imgSrc ? (
            <div className="mb-6 overflow-hidden rounded-2xl border border-pink-100/90 bg-white/70 shadow-[0_12px_40px_rgba(236,72,153,0.12)] ring-1 ring-pink-200/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imgSrc} alt="" className="h-auto w-full object-cover" />
            </div>
          ) : null}
          {data.description?.trim() ? (
            <p className="whitespace-pre-wrap text-base font-medium leading-relaxed text-slate-700">
              {data.description}
            </p>
          ) : (
            <p className="text-base font-medium text-slate-500">説明はありません。</p>
          )}
          <div className="mt-6 border-t border-violet-200/50 pt-6">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-violet-500/90">
              対象のメールアドレス
            </p>
            <p className="mt-2 break-all font-mono text-sm font-medium text-violet-950/90">{data.email}</p>
          </div>

          {!data.used ? (
            <div className="mt-8 space-y-4 border-t border-slate-200/60 pt-8">
              {useError ? (
                <p className="text-center text-sm font-medium text-rose-600" role="alert">
                  {useError}
                </p>
              ) : null}
              <button
                type="button"
                disabled={useSubmitting}
                onClick={() => void onUse()}
                className="w-full rounded-[1.25rem] bg-gradient-to-r from-pink-400 via-fuchsia-500 to-violet-600 px-4 py-4 text-base font-extrabold text-white shadow-[0_20px_50px_rgba(192,38,211,0.35)] transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {useSubmitting ? "処理中…" : "利用する"}
              </button>
              <p className="text-center text-xs font-medium leading-relaxed text-slate-600/90">
                店舗・会場で提示する際に押してください。
                <br />
                <span className="text-slate-500">利用済みになると再度は使えません。</span>
              </p>
            </div>
          ) : null}
        </section>
      </div>
    </CouponLpShell>
  );
}
