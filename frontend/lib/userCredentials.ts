/** 管理画面のユーザ登録・更新と API メッセージを揃える検証 */

export const REGISTRATION_EMAIL_INVALID_MSG = "メールアドレスの形式が正しくありません。";
export const REGISTRATION_PASSWORD_INVALID_MSG =
  "パスワードは英字・数字・記号を組み合わせ、8文字以上で設定してください。";
export const EMAIL_DUPLICATE_MSG = "このメールアドレスは既に登録されています。";

/** backend/app/user_credentials.py の記号クラスと同等 */
const SYMBOL_RE = /[!-/:-@[-`{-~]/;

const EMAIL_RE =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function registrationEmailViolation(email: string): string | null {
  const e = email.trim().toLowerCase();
  if (!e || e.length > 254) return REGISTRATION_EMAIL_INVALID_MSG;
  if (!EMAIL_RE.test(e)) return REGISTRATION_EMAIL_INVALID_MSG;
  return null;
}

export function registrationPasswordViolation(password: string): string | null {
  if (/\s/.test(password)) return REGISTRATION_PASSWORD_INVALID_MSG;
  if (password.length < 8) return REGISTRATION_PASSWORD_INVALID_MSG;
  if (!/[A-Za-z]/.test(password)) return REGISTRATION_PASSWORD_INVALID_MSG;
  if (!/[0-9]/.test(password)) return REGISTRATION_PASSWORD_INVALID_MSG;
  if (!SYMBOL_RE.test(password)) return REGISTRATION_PASSWORD_INVALID_MSG;
  return null;
}
