"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { CouponCreatePanel } from "../../../../components/admin/CouponCreatePanel";
import { CouponFeatureDisabledNotice } from "../../../../components/admin/CouponFeatureDisabledNotice";
import { useCouponAdminAccess } from "../../../../lib/useCouponAdminAccess";
import { useRedirectIfMissingAdminToken } from "../../../../lib/useRedirectIfMissingAdminToken";

export default function AdminCouponNewPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const couponAccess = useCouponAdminAccess(token, mounted);

  useEffect(() => {
    setMounted(true);
    setToken(localStorage.getItem("admin_token"));
  }, []);

  useRedirectIfMissingAdminToken(mounted, token);

  return (
    <main className="w-full max-w-none space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">クーポン新規登録</h1>
        </div>
        <Link
          className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200 hover:border-slate-500"
          href="/admin/coupons"
        >
          一覧へ戻る
        </Link>
      </header>

      {mounted && token && couponAccess === "loading" ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-950/40 p-4 text-sm text-slate-300">
          読み込み中…
        </div>
      ) : null}

      {mounted && token && couponAccess === "disabled" ? <CouponFeatureDisabledNotice /> : null}

      {mounted && couponAccess === "full" ? (
        <CouponCreatePanel token={token} onClose={() => router.push("/admin/coupons")} />
      ) : null}
    </main>
  );
}
