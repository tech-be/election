"""管理画面でのユーザメール・パスワード登録時の検証（API とメッセージ文言を共通化）。"""

from __future__ import annotations

import re

REGISTRATION_EMAIL_INVALID_MSG = "メールアドレスの形式が正しくありません。"
REGISTRATION_PASSWORD_INVALID_MSG = (
    "パスワードは英字・数字・記号を組み合わせ、8文字以上で設定してください。"
)
EMAIL_DUPLICATE_MSG = "このメールアドレスは既に登録されています。"

# 記号: ASCII の一般的な句読点・記号（英数字・空白以外の入力を求める）
_SYMBOL_RE = re.compile(r'[!\"#$%&\'()*+,\-./:;<=>?@[\\\]^_`{|}~]')

_EMAIL_RE = re.compile(
    r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$"
)


def registration_email_violation(email: str) -> str | None:
    if not email or len(email) > 254:
        return REGISTRATION_EMAIL_INVALID_MSG
    if not _EMAIL_RE.fullmatch(email):
        return REGISTRATION_EMAIL_INVALID_MSG
    return None


def registration_password_violation(password: str) -> str | None:
    if re.search(r"\s", password):
        return REGISTRATION_PASSWORD_INVALID_MSG
    if len(password) < 8:
        return REGISTRATION_PASSWORD_INVALID_MSG
    if not re.search(r"[A-Za-z]", password):
        return REGISTRATION_PASSWORD_INVALID_MSG
    if not re.search(r"[0-9]", password):
        return REGISTRATION_PASSWORD_INVALID_MSG
    if not _SYMBOL_RE.search(password):
        return REGISTRATION_PASSWORD_INVALID_MSG
    return None
