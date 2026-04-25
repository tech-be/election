"use client";

import { useEffect } from "react";

export function Modal({
  title,
  children,
  onClose,
  maxWidthClassName = "max-w-5xl",
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  maxWidthClassName?: string;
}) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full ${maxWidthClassName} max-h-[85vh] overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 border-b border-slate-800 px-5 py-4">
          <h2 id="modal-title" className="truncate text-base font-semibold text-slate-50">
            {title}
          </h2>
          <button
            type="button"
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-slate-500"
            onClick={onClose}
          >
            閉じる
          </button>
        </header>
        <div className="max-h-[calc(85vh-56px)] overflow-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

