"use client";

import Link from "next/link";

export function CouponFeatureDisabledNotice() {
  return (
    <div className="max-w-lg space-y-4 rounded-2xl border border-slate-700 bg-slate-950/40 p-6 text-slate-200">
      <p className="text-sm leading-relaxed">クーポン機能は、有料機能になります。</p>
      <p className="text-sm leading-relaxed">
        利用をご希望される場合は、お問い合わせフォームより、お問い合わせください
      </p>
      <p>
        <Link
          href="/contact"
          className="text-sm font-medium text-indigo-300 underline underline-offset-2 hover:text-indigo-200"
        >
          ＜お問い合わせはこちら＞
        </Link>
      </p>
    </div>
  );
}
