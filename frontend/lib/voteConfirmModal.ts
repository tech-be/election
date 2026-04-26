/** 投票直前の確認モーダル（DB未設定時の既定文言） */

export const DEFAULT_VOTE_CONFIRM_TITLE = "これで良いですか？";

export const DEFAULT_VOTE_CONFIRM_BODY_TEMPLATE =
  "選択した{need}件のアイテムを確認し、メールアドレスを入力のうえ投票してください。";

export function resolveVoteConfirmTitle(raw: string | null | undefined): string {
  const t = raw?.trim();
  return t && t.length > 0 ? t : DEFAULT_VOTE_CONFIRM_TITLE;
}

/** `{need}` を選択必須件数に置換 */
export function resolveVoteConfirmBody(raw: string | null | undefined, need: number): string {
  const t = raw?.trim() ? raw.trim() : DEFAULT_VOTE_CONFIRM_BODY_TEMPLATE;
  return t.replaceAll("{need}", String(need));
}
