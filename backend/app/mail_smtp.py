"""
SMTP 送信（Mailgun の SMTP ゲートウェイ等を想定）。設定は環境変数。

  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD
  SMTP_USE_TLS（既定: true）, SMTP_USE_SSL（既定: false, 465 用）
  MAIL_FROM（未設定時は SMTP_USER）
  SMTP_TIMEOUT（秒, 既定: 30）
"""

from __future__ import annotations

import os
import smtplib
import ssl
import logging
from email.message import EmailMessage
from typing import Sequence

logger = logging.getLogger(__name__)


def _truthy(name: str, default: str) -> bool:
    return os.getenv(name, default).strip().lower() in ("1", "true", "yes", "on")


def smtp_settings() -> dict:
    return {
        "host": (os.getenv("SMTP_HOST", "smtp.mailgun.org") or "smtp.mailgun.org").strip(),
        "port": int(os.getenv("SMTP_PORT", "587")),
        "user": (os.getenv("SMTP_USER", "") or "").strip(),
        "password": os.getenv("SMTP_PASSWORD", "") or "",
        "use_tls": _truthy("SMTP_USE_TLS", "true"),
        "use_ssl": _truthy("SMTP_USE_SSL", "false"),
        "mail_from": (os.getenv("MAIL_FROM", "") or os.getenv("SMTP_USER", "") or "").strip(),
        "timeout": int(os.getenv("SMTP_TIMEOUT", "30")),
    }


def is_smtp_configured() -> bool:
    s = smtp_settings()
    if not s["user"] or not s["password"]:
        return False
    if not s["host"] or not s["mail_from"]:
        return False
    return True


def send_smtp_message(
    *,
    to: Sequence[str] | str,
    subject: str,
    text: str,
    html: str | None = None,
) -> None:
    s = smtp_settings()
    if not s["user"] or not s["password"]:
        raise RuntimeError("smtp_not_configured")
    if not s["mail_from"]:
        raise RuntimeError("mail_from_not_set")
    if isinstance(to, str):
        recipients = [t.strip() for t in to.split(",") if t.strip()]
    else:
        recipients = [str(t).strip() for t in to if t and str(t).strip()]
    if not recipients:
        raise ValueError("no_recipients")

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = s["mail_from"]
    msg["To"] = ", ".join(recipients)
    msg.set_content(text)
    if html:
        msg.add_alternative(html, subtype="html")

    if s["use_ssl"]:
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(
            s["host"], s["port"], timeout=s["timeout"], context=context
        ) as smtp:
            smtp.login(s["user"], s["password"])
            smtp.send_message(msg)
    else:
        with smtplib.SMTP(s["host"], s["port"], timeout=s["timeout"]) as smtp:
            smtp.ehlo()
            if s["use_tls"]:
                context = ssl.create_default_context()
                smtp.starttls(context=context)
                smtp.ehlo()
            smtp.login(s["user"], s["password"])
            smtp.send_message(msg)

    logger.info("mail sent to %s (subject=%s)", recipients, subject[:80])
