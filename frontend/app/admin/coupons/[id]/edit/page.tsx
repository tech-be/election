"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { CouponEditPanel } from "../../../../../components/admin/CouponEditPanel";
import { CouponFeatureDisabledNotice } from "../../../../../components/admin/CouponFeatureDisabledNotice";
import { useCouponAdminAccess } from "../../../../../lib/useCouponAdminAccess";

export default function AdminCouponEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const idRaw = params.id;
  const couponId = /^\d+$/.test(idRaw) ? Number(idRaw) : NaN;

  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const couponAccess = useCouponAdminAccess(token, mounted);

  useEffect(() => {
    setMounted(true);
    setToken(localStorage.getItem("admin_token"));
  }, []);

  return (
    <main className="w-full max-w-none space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">クーポン編集</h1>
          <div className="mt-1 font-mono text-xs text-slate-500">ID: {idRaw}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200 hover:border-slate-500"
            href={`/coupon-preview/${couponId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            LPテスト表示
          </Link>
          <Link
            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200 hover:border-slate-500"
            href="/admin/coupons"
          >
            一覧へ戻る
          </Link>
        </div>
      </header>

      {mounted && token && couponAccess === "loading" ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-950/40 p-4 text-sm text-slate-300">
          読み込み中…
        </div>
      ) : null}

      {mounted && token && couponAccess === "disabled" ? <CouponFeatureDisabledNotice /> : null}

      {mounted && couponAccess === "full" ? (
        <CouponEditPanel
          couponId={couponId}
          token={token}
          showBackToList
          onClose={() => router.push("/admin/coupons")}
        />
      ) : null}
    </main>
  );
}
