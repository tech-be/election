"""管理画面の操作履歴。

- ログイン成功: `admin_login` から記録（詳細にマスク済みログイン情報）。
- その他: middleware で成功レスポンス時に記録。詳細に GET の query または JSON/テキスト body（マスク・長さ制限）。
  multipart（アップロード）は本文は記録しない。
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any

import anyio
from sqlmodel import Session, select
from starlette.requests import Request
from starlette.responses import Response

from app.auth import _legacy_admin_password
from app.db import engine
from app.models import AdminOperationLog, SessionToken

logger = logging.getLogger(__name__)

LEGACY_DETAIL_MARKER = "[legacy_sysadmin]"
MAX_LOG_DETAIL = 8000

# GET のうち一覧ページ読込ではなく「ダウンロード／結果参照」とみなすパス（末尾一致）
_AUDIT_GET_PATH_SUFFIXES = (
    "/vote-emails",
    "/vote-results",
    "/issued-csv",
)


def _should_audit_admin_get(path: str) -> bool:
    p = path.rstrip("/")
    return any(p.endswith(suf.rstrip("/")) for suf in _AUDIT_GET_PATH_SUFFIXES)


def resolve_scope_api_name(request: Request) -> str | None:
    """ルート処理後の scope から FastAPI / Starlette のエンドポイント関数名を取得する。"""
    ep = request.scope.get("endpoint")
    if ep is None:
        route = request.scope.get("route")
        if route is not None:
            ep = getattr(route, "endpoint", None)
    seen: set[int] = set()
    cur: Any = ep
    while cur is not None:
        oid = id(cur)
        if oid in seen:
            break
        seen.add(oid)
        name = getattr(cur, "__name__", None)
        if isinstance(name, str) and name and not name.startswith("<"):
            return name[:128]
        cur = getattr(cur, "__wrapped__", None)
    return None


def _redact_obj(o: Any) -> Any:
    if isinstance(o, dict):
        out: dict[str, Any] = {}
        for k, v in o.items():
            kl = str(k).lower()
            if kl in ("password", "secret", "token", "authorization") or "password" in kl or "secret" in kl:
                out[str(k)] = "***"
            else:
                out[str(k)] = _redact_obj(v)
        return out
    if isinstance(o, list):
        return [_redact_obj(x) for x in o]
    return o


def _format_body_line(body: bytes, content_type: str | None) -> str:
    raw_ct = (content_type or "").split(";")[0].strip().lower()
    try:
        text = body.decode("utf-8")
    except UnicodeDecodeError:
        return "body: (binary, not logged)"
    text_stripped = text.strip()
    looks_json = "json" in raw_ct or text_stripped.startswith("{") or text_stripped.startswith("[")
    if looks_json:
        try:
            data = json.loads(text)
            redacted = _redact_obj(data)
            s = json.dumps(redacted, ensure_ascii=False)
        except json.JSONDecodeError:
            s = _redact_plain_secrets(text)
    else:
        s = _redact_plain_secrets(text)
    max_body = 6000
    if len(s) > max_body:
        s = s[: max_body - 30] + "…(truncated)"
    return f"body: {s}"


_PASSWORD_LIKE = re.compile(
    r"(?i)(password|secret|token)\s*[=:]\s*([^\s&\"',]+|\"[^\"]*\"|'[^']*')",
)


def _redact_plain_secrets(text: str) -> str:
    return _PASSWORD_LIKE.sub(lambda m: f"{m.group(1)}=***", text)


def format_request_capture_for_audit_resolved(
    method: str,
    path: str,
    query_string: str,
    body: bytes | None,
    content_type: str | None,
    multipart_skipped: bool,
) -> str | None:
    """path を渡し、GET 監査時に query のみが適切に出るようにする。"""
    lines: list[str] = []
    qs = query_string or ""
    if qs:
        lines.append(f"query: {qs}")
    elif method.upper() == "GET" and _should_audit_admin_get(path):
        lines.append("query: (empty)")
    if multipart_skipped:
        lines.append("body: (multipart/form-data, file content not logged)")
    elif body is not None:
        if len(body) == 0:
            lines.append("body: (empty)")
        else:
            lines.append(_format_body_line(body, content_type))
    if not lines:
        return None
    out = "\n".join(lines)
    if len(out) > MAX_LOG_DETAIL:
        return out[: MAX_LOG_DETAIL - 20] + "…(truncated)"
    return out


def append_admin_operation_log(
    *,
    user_id: int | None,
    screen: str,
    operation: str,
    detail: str | None = None,
    api_name: str | None = None,
) -> None:
    """操作ログを1件追加（失敗しても例外は握りつぶす）。"""
    try:
        if detail and len(detail) > MAX_LOG_DETAIL:
            detail = detail[: MAX_LOG_DETAIL - 20] + "…(truncated)"
        if api_name:
            api_name = api_name[:128]
        with Session(engine) as session:
            session.add(
                AdminOperationLog(
                    user_id=user_id,
                    screen=screen[:300],
                    operation=operation[:200],
                    api_name=api_name,
                    detail=detail,
                ),
            )
            session.commit()
    except Exception:
        logger.exception("admin operation log append failed")


def _resolve_audit_user_id(session: Session, bearer_token: str) -> tuple[int | None, bool]:
    """(user_id, should_log). user_id はレガシートークンのとき None。"""
    if bearer_token == _legacy_admin_password():
        return None, True
    row = session.exec(select(SessionToken).where(SessionToken.token == bearer_token)).first()
    if row is None:
        return None, False
    return int(row.user_id), True


def record_admin_operation_sync(
    path: str,
    method: str,
    bearer_token: str,
    request_capture: str | None = None,
    api_name: str | None = None,
) -> None:
    try:
        with Session(engine) as session:
            uid, ok = _resolve_audit_user_id(session, bearer_token)
    except Exception:
        logger.exception("admin operation audit resolve user failed")
        return
    if not ok:
        return
    parts: list[str] = []
    if bearer_token == _legacy_admin_password():
        parts.append(LEGACY_DETAIL_MARKER)
    if request_capture:
        parts.append(request_capture)
    detail = "\n".join(parts) if parts else None
    append_admin_operation_log(
        user_id=uid,
        screen=path,
        operation=f"{method} {path}",
        detail=detail,
        api_name=api_name,
    )


async def admin_operation_audit_middleware(request: Request, call_next):
    path = request.url.path
    method = request.method.upper()
    query_string = request.url.query or ""
    content_type_header = request.headers.get("content-type")

    body_bytes: bytes | None = None
    multipart_skipped = False
    req_in = request

    is_admin = path.startswith("/api/admin/")
    login_path = path.rstrip("/") == "/api/admin/login"
    is_mut = method in ("POST", "PATCH", "PUT", "DELETE")
    is_audit_get = method == "GET" and _should_audit_admin_get(path)

    if is_admin and not login_path and is_mut:
        ct_lower = (content_type_header or "").lower()
        if path.rstrip("/") == "/api/admin/uploads" or "multipart/form-data" in ct_lower:
            multipart_skipped = True
        else:
            body_bytes = await request.body()

            async def receive():
                return {"type": "http.request", "body": body_bytes, "more_body": False}

            req_in = Request(request.scope, receive)

    response: Response = await call_next(req_in)

    if not is_admin:
        return response
    try:
        if response.status_code < 200 or response.status_code >= 300:
            return response
        if not is_mut and not is_audit_get:
            return response
        if login_path:
            return response
        auth_header = req_in.headers.get("authorization") or ""
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return response
        token = parts[1].strip()

        if is_audit_get:
            capture = format_request_capture_for_audit_resolved(
                method,
                path,
                query_string,
                None,
                None,
                False,
            )
        else:
            capture = format_request_capture_for_audit_resolved(
                method,
                path,
                query_string,
                body_bytes,
                content_type_header,
                multipart_skipped,
            )

        handler_name = resolve_scope_api_name(req_in)
        await anyio.to_thread.run_sync(
            record_admin_operation_sync,
            path,
            method,
            token,
            capture,
            handler_name,
        )
    except Exception:
        logger.exception("admin operation audit middleware failed")
    return response
