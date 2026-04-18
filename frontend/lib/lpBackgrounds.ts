export const LP_BACKGROUND_OPTIONS = [
  { key: "pastel_lavender", label: "ラベンダー・ミルク（白×紫×ピンク）" },
  { key: "pastel_mint", label: "ミント・ソーダ（白×ミント×アクア）" },
  { key: "pastel_peach", label: "ピーチ・クリーム（白×桃×コーラル）" },
  { key: "pastel_sky", label: "スカイ・キャンディ（白×空色×ラベンダー）" },
  { key: "pastel_lemon", label: "レモン・シャーベット（白×レモン×ライム）" },
] as const;

export type LpBackgroundKey = (typeof LP_BACKGROUND_OPTIONS)[number]["key"];

const ALLOWED = new Set<string>(LP_BACKGROUND_OPTIONS.map((o) => o.key));

/** APIの `lp_background_key` → CSSクラス（`globals.css` の `.lp-bg-*`） */
export function lpBackgroundClassName(key: string | null | undefined): string {
  const k = key && ALLOWED.has(key) ? key : "pastel_lavender";
  const slug = k.replace(/_/g, "-");
  return `lp-bg-${slug}`;
}
