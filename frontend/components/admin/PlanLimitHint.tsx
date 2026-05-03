"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

function DefaultTooltipBody() {
  return (
    <div className="space-y-2">
      <p>上限を上げる場合は、プランの変更が必要になります。</p>
      <p>
        問い合わせフォームより「プラン変更希望」としてテナント名とご担当者様のご連絡先を記載の上お問い合わせください。
        <Link href="/contact" className="text-indigo-300 underline hover:text-indigo-200">
          問い合わせフォームはこちら
        </Link>
        。
      </p>
    </div>
  );
}

function LampIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  );
}

export function PlanLimitHint({
  valueLabel,
  tooltipContent,
}: {
  valueLabel: React.ReactNode;
  /** 未指定時はプラン変更・問い合わせ案内（既定文） */
  tooltipContent?: React.ReactNode;
}) {
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const hoverLeaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tipId = useId();
  const visible = pinned || hover || focused;

  function clearHoverLeaveTimer() {
    if (hoverLeaveTimer.current !== null) {
      clearTimeout(hoverLeaveTimer.current);
      hoverLeaveTimer.current = null;
    }
  }

  function scheduleHoverLeave() {
    clearHoverLeaveTimer();
    hoverLeaveTimer.current = setTimeout(() => setHover(false), 180);
  }

  useEffect(() => () => clearHoverLeaveTimer(), []);

  useEffect(() => {
    if (!pinned) return;
    const close = (e: MouseEvent | TouchEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setPinned(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, [pinned]);

  return (
    <div
      ref={wrapRef}
      className="relative inline-flex max-w-full items-center gap-1.5"
      onMouseEnter={() => {
        clearHoverLeaveTimer();
        setHover(true);
      }}
      onMouseLeave={() => scheduleHoverLeave()}
    >
      <span className="text-slate-300">
        プラン上限数：
        <span className="ml-1 tabular-nums font-medium text-slate-100">{valueLabel}</span>
      </span>
      <button
        type="button"
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-amber-300/90 outline-none ring-offset-2 ring-offset-slate-950 hover:bg-slate-800/80 hover:text-amber-200 focus-visible:ring-2 focus-visible:ring-indigo-400"
        aria-label="プラン上限数の説明を表示"
        aria-describedby={visible ? tipId : undefined}
        aria-expanded={visible}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onClick={() => setPinned((p) => !p)}
      >
        <LampIcon className="h-4 w-4" />
      </button>
      <div
        id={tipId}
        role="tooltip"
        hidden={!visible}
        className="absolute left-0 top-full z-[100] mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-left text-xs leading-relaxed text-slate-100 shadow-xl ring-1 ring-white/10"
      >
        {tooltipContent ?? <DefaultTooltipBody />}
      </div>
    </div>
  );
}
