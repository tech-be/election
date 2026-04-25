"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";

import { PopDecorations } from "../../../components/lp/PopDecorations";
import { apiGet, type Coupon } from "../../../lib/api";
import { lpBackgroundClassName } from "../../../lib/lpBackgrounds";
import { resolveMediaUrl } from "../../../lib/products";
import { lpFont } from "../../lpFont";

function CouponLpShellForPreview({
  children,
  narrow = true,
}: {
  children: ReactNode;
  narrow?: boolean;
}) {
  return (
    <div
      className={`${lpFont.className} ${lpBackgroundClassName("pastel_peach")} relative h-full w-full overflow-x-hidden`}
    >
      <PopDecorations />
      <div
        className={`relative z-10 mx-auto w-full px-4 pb-12 pt-8 ${narrow ? "max-w-lg" : "max-w-3xl"}`}
      >
        {children}
      </div>
    </div>
  );
}

function CouponLpBody({ coupon }: { coupon: Coupon }) {
  const imgSrc = coupon.image_url ? resolveMediaUrl(coupon.image_url) : "";
  const customLpTitle = coupon.lp_title?.trim() ?? "";

  return (
    <div className="space-y-5">
      <section className="rounded-[1.75rem] border border-white/80 bg-white/80 p-6 shadow-[0_20px_60px_rgba(167,139,250,0.12)] backdrop-blur-md">
        <h2 className="mb-6 text-center text-2xl font-extrabold leading-snug tracking-tight text-slate-900 sm:text-3xl sm:leading-tight">
          {customLpTitle ? (
            <span className="whitespace-pre-line">{customLpTitle}</span>
          ) : (
            <>
              特典を確認して、
              <br className="sm:hidden" />
              ご利用ください{" "}
              <span className="inline-block" aria-hidden>
                ✨
              </span>
            </>
          )}
        </h2>

        {imgSrc ? (
          <div className="mb-6 overflow-hidden rounded-2xl border border-pink-100/90 bg-white/70 shadow-[0_12px_40px_rgba(236,72,153,0.12)] ring-1 ring-pink-200/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imgSrc} alt="" className="h-auto w-full object-cover" />
          </div>
        ) : null}

        {coupon.description?.trim() ? (
          <p className="whitespace-pre-wrap text-base font-medium leading-relaxed text-slate-700">
            {coupon.description}
          </p>
        ) : (
          <p className="text-base font-medium text-slate-500">説明はありません。</p>
        )}

        <div className="mt-6 border-t border-violet-200/50 pt-6">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-violet-500/90">
            対象のメールアドレス
          </p>
          <p className="mt-2 break-all font-mono text-sm font-medium text-violet-950/90">test@example.com</p>
        </div>

        <div className="mt-8 space-y-4 border-t border-slate-200/60 pt-8">
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-[1.25rem] bg-gradient-to-r from-pink-400 via-fuchsia-500 to-violet-600 px-4 py-4 text-base font-extrabold text-white opacity-60 shadow-[0_20px_50px_rgba(192,38,211,0.35)]"
          >
            利用する（テスト表示では無効）
          </button>
        </div>
      </section>
    </div>
  );
}

function Frame({
  title,
  width,
  height,
  children,
}: {
  title: string;
  width?: number;
  height?: number;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-end justify-between gap-3">
        <div className="text-sm font-semibold text-slate-100">{title}</div>
        {width && height ? (
          <div className="text-xs font-mono text-slate-400">
            {width}×{height}
          </div>
        ) : null}
      </div>
      <div
        className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
        style={width && height ? { width, height } : undefined}
      >
        <div className="h-full w-full overflow-auto">{children}</div>
      </div>
    </section>
  );
}

export default function CouponPreviewPage() {
  const params = useParams<{ id: string }>();
  const idRaw = params?.id;
  const couponId = typeof idRaw === "string" && /^\d+$/.test(idRaw) ? Number(idRaw) : NaN;

  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setToken(localStorage.getItem("admin_token"));
  }, []);

  const load = useCallback(async () => {
    if (!token || !Number.isFinite(couponId)) return;
    setLoadError(null);
    try {
      const row = await apiGet<Coupon>(`/admin/coupons/${couponId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCoupon(row);
    } catch {
      setLoadError("取得に失敗しました");
      setCoupon(null);
    }
  }, [token, couponId]);

  useEffect(() => {
    void load();
  }, [load]);

  const header = useMemo(() => {
    return (
      <div className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <div className="text-xs text-slate-400">管理画面 / クーポンLP テスト表示</div>
            <div className="truncate text-sm font-semibold text-slate-100">クーポンID: {idRaw}</div>
          </div>
          <button
            type="button"
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-slate-500"
            onClick={() => {
              // window.open() で開かれたタブ以外では close() が効かないことがあるためフォールバックする
              window.close();
              window.history.back();
            }}
          >
            閉じる
          </button>
        </div>
      </div>
    );
  }, [couponId, idRaw]);

  if (!mounted) return null;

  if (!token) {
    return (
      <main className="mx-auto max-w-lg px-4 py-12">
        <div className="rounded-2xl border border-rose-800/60 bg-rose-950/20 p-4 text-sm text-rose-200">
          ログインしている時のみ、クーポンLPのテスト表示ができます。先に{" "}
          <Link className="underline" href="/admin/login">
            ログイン
          </Link>{" "}
          してください。
        </div>
      </main>
    );
  }

  if (!Number.isFinite(couponId)) {
    return (
      <main className="mx-auto max-w-lg px-4 py-12">
        <div className="rounded-2xl border border-rose-800/60 bg-rose-950/20 p-4 text-sm text-rose-200">
          不正なIDです。
        </div>
      </main>
    );
  }

  if (loadError || !coupon) {
    return (
      <main className="mx-auto max-w-lg px-4 py-12">
        <div className="rounded-2xl border border-rose-800/60 bg-rose-950/20 p-4 text-sm text-rose-200">
          {loadError ?? "読み込み中…"}
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {header}
      <main className="mx-auto w-full max-w-7xl space-y-4 px-4 py-6">
        <div className="rounded-2xl border border-indigo-200/40 bg-indigo-500/10 px-4 py-3 text-xs font-semibold text-indigo-100">
          テスト表示（一般公開されません）。PC表示とモバイル表示（iPhone SE相当）を同時に確認できます。
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <Frame title="PC表示（目安）">
            <CouponLpShellForPreview narrow={false}>
              <CouponLpBody coupon={coupon} />
            </CouponLpShellForPreview>
          </Frame>

          <Frame title="モバイル表示（iPhone SE）" width={320} height={568}>
            <CouponLpShellForPreview narrow>
              <CouponLpBody coupon={coupon} />
            </CouponLpShellForPreview>
          </Frame>
        </div>
      </main>
    </div>
  );
}

