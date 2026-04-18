/** ランディングURL未登録時に最後に出すメッセージのデフォルト（DB未登録時） */
export const DEFAULT_NO_LANDING_END_MESSAGE = "ご参加ありがとうございました！";

export function resolveNoLandingEndMessage(raw: string | null | undefined): string {
  const t = raw?.trim();
  return t || DEFAULT_NO_LANDING_END_MESSAGE;
}
