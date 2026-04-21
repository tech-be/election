"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { apiPost, type VoteSubmitResponse } from "../../lib/api";
import { resolveMediaUrl, type ProductDraft } from "../../lib/products";
import { resolveNoLandingEndMessage } from "../../lib/noLandingEndMessage";
import { resolveVoteConfirmBody, resolveVoteConfirmTitle } from "../../lib/voteConfirmModal";
import { requiredVoteSelections } from "../../lib/voteSelection";

type Props = {
  campaignCode: string;
  products: ProductDraft[];
  thankYouMessage: string | null;
  landingUrl: string | null;
  /** 企画の vote_max_products（未設定時は API 既定に合わせ 3 相当） */
  voteMaxProducts?: number;
  /** ランディングURL未設定時の終了メッセージ（DB未登録時は resolve でデフォルト） */
  noLandingEndMessage?: string | null;
  /** 投票前確認モーダルの見出し（未設定時は既定文言） */
  voteConfirmTitle?: string | null;
  /** 投票前確認モーダルの本文（`{need}` で選択件数に置換、未設定時は既定文言） */
  voteConfirmBody?: string | null;
};

function isValidEmail(raw: string): boolean {
  const s = raw.trim().toLowerCase();
  if (s.length < 5 || s.length > 254) return false;
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);
}

/** テキストから最初の http(s) URL を取り出す（複数行・メモ混在に対応） */
function pickFirstHttpUrl(text: string | null | undefined): string | null {
  if (!text?.trim()) return null;
  const direct = text.match(/https?:\/\/[^\s<>"']+/i);
  if (direct) return direct[0];
  for (const line of text.split(/\n/)) {
    const t = line.trim();
    if (!t) continue;
    try {
      const u = new URL(t);
      if (u.protocol === "http:" || u.protocol === "https:") return u.href;
    } catch {
      /* fallthrough */
    }
    try {
      if (/[.]/.test(t) && !/\s/.test(t)) {
        return new URL(`https://${t}`).href;
      }
    } catch {
      /* noop */
    }
  }
  return null;
}

export function CampaignVoteSection({
  campaignCode,
  products,
  thankYouMessage,
  landingUrl,
  voteMaxProducts,
  noLandingEndMessage,
  voteConfirmTitle,
  voteConfirmBody,
}: Props) {
  const need = useMemo(
    () => requiredVoteSelections(voteMaxProducts ?? 3, products.length),
    [voteMaxProducts, products.length],
  );

  const [selectedOrder, setSelectedOrder] = useState<number[]>([]);

  useEffect(() => {
    setSelectedOrder((prev) => {
      if (prev.length <= need) return prev;
      return prev.slice(0, need);
    });
  }, [need]);
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);
  /** 投票後、ランディングURLなしのときの全画面サンクス */
  const [plainThankYouEnd, setPlainThankYouEnd] = useState(false);
  /** 企画連動クーポン発行時の LP トークン（/coupon/{token}） */
  const [issuedCouponTokens, setIssuedCouponTokens] = useState<string[]>([]);

  const selectedSet = useMemo(() => new Set(selectedOrder), [selectedOrder]);
  const couponHref = useMemo(() => pickFirstHttpUrl(landingUrl ?? undefined), [landingUrl]);

  const toggle = useCallback(
    (idx: number) => {
      setSelectedOrder((prev) => {
        const pos = prev.indexOf(idx);
        if (pos >= 0) {
          return prev.filter((i) => i !== idx);
        }
        if (prev.length >= need) return prev;
        return [...prev, idx];
      });
    },
    [need],
  );

  const openConfirm = useCallback(() => {
    if (need === 0 || selectedOrder.length !== need) return;
    setError(null);
    setDoneMessage(null);
    setIssuedCouponTokens([]);
    setEmail("");
    setModalOpen(true);
  }, [need, selectedOrder.length]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setError(null);
    setSubmitting(false);
    setIssuedCouponTokens([]);
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen, closeModal]);

  const submitVote = useCallback(async () => {
    if (!isValidEmail(email) || need === 0 || selectedOrder.length !== need) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiPost<VoteSubmitResponse>(
        `/campaigns/${encodeURIComponent(campaignCode)}/votes`,
        {
          email: email.trim(),
          product_indices: selectedOrder,
        },
      );
      const tokens = res.coupon_tokens ?? [];
      setIssuedCouponTokens(tokens);
      const fromApi =
        res.thank_you_message != null && String(res.thank_you_message).trim()
          ? String(res.thank_you_message).trim()
          : null;
      const fromProps =
        thankYouMessage != null && String(thankYouMessage).trim()
          ? String(thankYouMessage).trim()
          : null;
      const msg = fromApi ?? fromProps ?? "投票ありがとうございました。";
      const externalUrl = pickFirstHttpUrl(landingUrl ?? undefined);
      const hasIssuedCoupons = tokens.length > 0;
      if (!externalUrl && !hasIssuedCoupons) {
        setModalOpen(false);
        setPlainThankYouEnd(true);
        return;
      }
      setDoneMessage(msg);
    } catch (e) {
      const text = e instanceof Error ? e.message : String(e);
      let detail = "";
      try {
        detail = String((JSON.parse(text) as { detail?: unknown }).detail ?? "");
      } catch {
        detail = text;
      }
      if (detail.toLowerCase().includes("already voted")) {
        setError("このメールアドレスでは既に投票済みです。");
      } else {
        setError("送信に失敗しました。時間をおいて再度お試しください。");
      }
    } finally {
      setSubmitting(false);
    }
  }, [campaignCode, email, landingUrl, need, selectedOrder, thankYouMessage]);

  const handleCouponClick = useCallback(() => {
    if (!couponHref) return;
    window.location.assign(couponHref);
  }, [couponHref]);

  if (products.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200/90 bg-white/85 p-6 text-sm text-slate-600 shadow-sm backdrop-blur">
        登録されていません
      </div>
    );
  }

  if (plainThankYouEnd) {
    const endLine = resolveNoLandingEndMessage(noLandingEndMessage);
    return (
      <div className="fixed inset-0 z-[250] flex items-center justify-center bg-white px-6">
        <p className="whitespace-pre-wrap text-center text-lg font-medium tracking-tight text-slate-900">
          {endLine}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-28">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200/90 bg-white/90 px-5 py-4 text-sm text-slate-800 shadow-sm backdrop-blur">
        <div>
          好きなアイテムを{" "}
          <span className="font-extrabold text-slate-900">{need}件</span> 選んで投票！
        </div>
        <div className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-900">
          選択 {selectedOrder.length}/{need}
        </div>
      </div>
      <div className="space-y-8">
        {products.map((p, idx) => {
          const images = [p.image1Url, p.image2Url, p.image3Url].filter(
            (u): u is string => Boolean(u && String(u).trim()),
          );
          const on = selectedSet.has(idx);
          return (
            <div
              key={p.sortId ?? `product-${idx}`}
              className={`overflow-hidden rounded-3xl border text-left shadow-[0_16px_48px_rgba(15,23,42,0.08)] backdrop-blur transition ${
                on
                  ? "border-indigo-400 ring-4 ring-indigo-300/35"
                  : "border-slate-200/90 hover:border-slate-300"
              } bg-white/90`}
            >
              <article>
                <div className="space-y-3 p-6">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {on ? (
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-extrabold text-indigo-900">
                        選択中
                      </span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => toggle(idx)}
                      className={`rounded-2xl px-4 py-2 text-sm font-extrabold transition ${
                        on
                          ? "border border-indigo-400 bg-indigo-600 text-white hover:bg-indigo-500"
                          : "border border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      {on ? "選択を解除" : "選択"}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(idx)}
                    aria-pressed={on}
                    aria-label={
                      on
                        ? `${p.name || "このアイテム"}の選択を解除`
                        : `${p.name || "このアイテム"}を選択`
                    }
                    className="w-full rounded-xl text-left text-2xl font-extrabold tracking-tight text-slate-900 outline-none ring-indigo-500/0 transition hover:bg-slate-50/90 focus-visible:ring-2 focus-visible:ring-indigo-400"
                  >
                    {p.name || "（名称なし）"}
                  </button>
                  {p.description ? (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                      {p.description}
                    </p>
                  ) : null}
                </div>
                {images.length > 0 ? (
                  <div
                    className={`grid justify-items-center gap-2 border-t border-slate-100 bg-slate-50/80 p-4 ${
                      images.length === 1
                        ? "grid-cols-1"
                        : images.length === 2
                          ? "grid-cols-1 sm:grid-cols-2"
                          : "grid-cols-1 sm:grid-cols-3"
                    }`}
                  >
                    {images.map((raw, i) => {
                      const src = resolveMediaUrl(raw);
                      if (!src) return null;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => toggle(idx)}
                          aria-pressed={on}
                          aria-label={
                            on
                              ? `${p.name || "アイテム"}の画像${i + 1}・選択を解除`
                              : `${p.name || "アイテム"}の画像${i + 1}をタップして選択`
                          }
                          className="relative aspect-square w-full max-w-[320px] overflow-hidden rounded-2xl border border-slate-200 bg-transparent p-0 text-left outline-none ring-indigo-500/0 transition hover:border-indigo-300 hover:opacity-95 focus-visible:ring-2 focus-visible:ring-indigo-400"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={src}
                            alt=""
                            className="h-full w-full object-cover"
                            loading={idx === 0 && i === 0 ? "eager" : "lazy"}
                          />
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </article>
            </div>
          );
        })}
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/95 bg-white/92 shadow-[0_-8px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto flex w-full max-w-[740px] items-center justify-between gap-4 px-4 py-3">
          <p className="text-sm text-slate-700">
            選択{" "}
            <span className="rounded-full bg-slate-100 px-2 py-1 font-mono font-extrabold text-slate-900">
              {selectedOrder.length}
            </span>
            /{need}
          </p>
          <button
            type="button"
            disabled={need === 0 || selectedOrder.length !== need}
            onClick={openConfirm}
            className="inline-flex min-w-[8rem] items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-400 hover:to-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            投票する
          </button>
        </div>
      </div>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="vote-confirm-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
            {doneMessage ? (
              <div className="space-y-5">
                <h2 id="vote-confirm-title" className="text-lg font-semibold text-slate-900">
                  投票完了
                </h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                  {doneMessage}
                </p>
                <div className="flex flex-col gap-3">
                  {issuedCouponTokens.length > 0 ? (
                    <div className="space-y-2">
                      {issuedCouponTokens.map((tok, i) => (
                        <Link
                          key={tok}
                          href={`/coupon/${encodeURIComponent(tok)}`}
                          className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-3 text-sm font-extrabold text-white shadow-md hover:from-violet-400 hover:to-indigo-400"
                        >
                          {issuedCouponTokens.length > 1
                            ? `クーポン ${i + 1} を表示`
                            : "クーポンを表示する"}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                  {couponHref ? (
                    <button
                      type="button"
                      onClick={handleCouponClick}
                      className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 px-4 py-3 text-sm font-extrabold text-amber-950 hover:from-amber-300 hover:to-orange-300"
                    >
                      クーポンをゲット
                    </button>
                  ) : null}
                  {!couponHref && issuedCouponTokens.length === 0 ? (
                    <p className="text-center text-xs text-slate-500">
                      ランディング先URLが未設定のため、外部へのクーポン導線は利用できません。
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOrder([]);
                      setDoneMessage(null);
                      setIssuedCouponTokens([]);
                      closeModal();
                    }}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-extrabold text-slate-800 hover:bg-slate-50"
                  >
                    閉じる
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 id="vote-confirm-title" className="text-lg font-semibold text-slate-900">
                  {resolveVoteConfirmTitle(voteConfirmTitle)}
                </h2>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                  {resolveVoteConfirmBody(voteConfirmBody, need)}
                </p>

                <ul className="mt-5 space-y-3">
                  {selectedOrder.map((i) => {
                    const p = products[i];
                    const thumb =
                      [p.image1Url, p.image2Url, p.image3Url].find((u) => u && String(u).trim()) ??
                      null;
                    const src = thumb ? resolveMediaUrl(String(thumb)) : "";
                    return (
                      <li
                        key={i}
                        className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3"
                      >
                        {src ? (
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt="" className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs text-slate-500">
                            No img
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="truncate font-medium text-slate-900">
                            {p.name || "（名称なし）"}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-6 space-y-2">
                  <label htmlFor="vote-email" className="text-sm font-medium text-slate-800">
                    メールアドレス
                  </label>
                  <input
                    id="vote-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-indigo-500/0 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25"
                  />
                </div>

                {error ? (
                  <p className="mt-3 text-sm text-rose-600" role="alert">
                    {error}
                  </p>
                ) : null}

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    戻る
                  </button>
                  <button
                    type="button"
                    disabled={!isValidEmail(email) || submitting}
                    onClick={() => void submitVote()}
                    className="rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {submitting ? "送信中…" : "投票する"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
