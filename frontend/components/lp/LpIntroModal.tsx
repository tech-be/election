"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { resolveMediaUrl } from "../../lib/products";

type Props = {
  campaignCode: string;
  title: string | null | undefined;
  imageUrl: string | null | undefined;
  bodyText: string | null | undefined;
};

function hasIntroContent(p: Props): boolean {
  const t = p.title?.trim();
  const u = p.imageUrl?.trim();
  const x = p.bodyText?.trim();
  return Boolean(t || u || x);
}

export function LpIntroModal({ campaignCode, title, imageUrl, bodyText }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!hasIntroContent({ campaignCode, title, imageUrl, bodyText })) return;
    try {
      const key = `funsite_lp_intro_dismissed_${campaignCode}`;
      if (typeof window !== "undefined" && sessionStorage.getItem(key)) return;
    } catch {
      /* ignore */
    }
    setOpen(true);
  }, [campaignCode, title, imageUrl, bodyText]);

  const close = useCallback(() => {
    try {
      sessionStorage.setItem(`funsite_lp_intro_dismissed_${campaignCode}`, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  }, [campaignCode]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open || !hasIntroContent({ campaignCode, title, imageUrl, bodyText })) return null;

  const imgSrc = imageUrl?.trim() ? resolveMediaUrl(imageUrl.trim()) : "";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lp-intro-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="はじめる"
        onClick={close}
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        {title?.trim() ? (
          <h2
            id="lp-intro-modal-title"
            className="text-center text-xl font-bold tracking-tight text-slate-900"
          >
            {title.trim()}
          </h2>
        ) : (
          <h2 id="lp-intro-modal-title" className="sr-only">
            ご案内
          </h2>
        )}

        {imgSrc ? (
          <div
            className={`mx-auto w-full max-w-[320px] overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 ${title?.trim() ? "mt-4" : ""}`}
          >
            <div className="relative aspect-[16/10] w-full">
              <Image
                src={imgSrc}
                alt={title?.trim() || "説明画像"}
                fill
                className="object-contain"
                sizes="320px"
              />
            </div>
          </div>
        ) : null}

        {bodyText?.trim() ? (
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {bodyText.trim()}
          </p>
        ) : null}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={close}
            className="rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-extrabold text-white shadow-md hover:bg-indigo-500"
          >
            はじめる
          </button>
        </div>
      </div>
    </div>
  );
}
