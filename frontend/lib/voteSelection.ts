/** 企画の vote_max_products（1〜10）を正規化 */
export function clampVoteMaxProducts(n: unknown): number {
  const x = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(x)) return 3;
  return Math.min(10, Math.max(1, Math.floor(x)));
}

/** 実際に選ぶ必要がある件数（設定と登録アイテム数の小さい方） */
export function requiredVoteSelections(voteMaxProducts: unknown, productCount: number): number {
  const cap = clampVoteMaxProducts(voteMaxProducts);
  return Math.min(cap, Math.max(0, productCount));
}
