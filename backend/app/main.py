import csv
import io
import json
import os
import re
import uuid
import hashlib
import secrets
from datetime import datetime, timezone
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.auth import get_current_user, require_campaign_manager, require_sysadmin
from app.db import get_session
from app.models import (
    Campaign,
    CampaignCreate,
    CampaignUpdate,
    Coupon,
    CouponCreate,
    CouponIssue,
    CouponUpdate,
    SessionToken,
    Tenant,
    User,
    Vote,
)

LP_BACKGROUND_KEYS = frozenset(
    ("pastel_lavender", "pastel_mint", "pastel_peach", "pastel_sky", "pastel_lemon"),
)


def _normalize_lp_background_key(raw: str | None) -> str:
    key = (raw or "pastel_lavender").strip()
    if key not in LP_BACKGROUND_KEYS:
        raise HTTPException(status_code=400, detail="invalid lp_background_key")
    return key


def _clamp_vote_max_products(raw: int | None) -> int:
    try:
        n = int(raw if raw is not None else 3)
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="invalid vote_max_products")
    if n < 1 or n > 10:
        raise HTTPException(status_code=400, detail="vote_max_products must be 1..10")
    return n


def _assert_sysadmin_or_tenant_of_tenant(user: User, tenant_id: int) -> None:
    if user.role == "sysadmin":
        return
    if user.role in ("tenant", "user") and user.tenant_id is not None and user.tenant_id == tenant_id:
        return
    raise HTTPException(status_code=403, detail="forbidden")


def _assert_coupon_access(row: Coupon, user: User) -> None:
    if user.role == "sysadmin":
        return
    if user.role in ("tenant", "user") and user.tenant_id is not None and user.tenant_id == row.tenant_id:
        return
    raise HTTPException(status_code=403, detail="forbidden")


def _assert_tenant_coupons_feature(session: Session, tenant_id: int, user: User) -> None:
    """テナント配下ユーザ・ユーザ権限は、当該テナントでクーポンが無効ならクーポン API を利用不可。シスアドは常に可。"""
    if user.role == "sysadmin":
        return
    t = session.get(Tenant, tenant_id)
    if not t or not t.coupons_enabled:
        raise HTTPException(status_code=403, detail="coupons disabled for tenant")


def _validate_coupon_campaign_link(
    session: Session,
    tenant_id: int,
    campaign_id: int | None,
) -> int | None:
    if campaign_id is None:
        return None
    c = session.get(Campaign, int(campaign_id))
    if not c:
        raise HTTPException(status_code=404, detail="campaign not found")
    if c.tenant_id != tenant_id:
        raise HTTPException(status_code=400, detail="campaign tenant mismatch")
    return int(campaign_id)


app = FastAPI(title="funsite backend", version="0.1.0")

cors_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]
if cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "/data/uploads")).resolve()
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Host from docker-compose uses 8001->8000, so links like http://localhost:8001/uploads/...
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

api_router = APIRouter(prefix="/api")


@api_router.get("/health")
def health():
    return {"ok": True}


@api_router.post("/admin/login")
def admin_login(
    payload: dict,
    session: Annotated[Session, Depends(get_session)],
):
    """
    Backward compatible login.
    - old: {password} == ADMIN_PASSWORD -> returns legacy token
    - new: {email,password} -> returns session token
    """
    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", ""))

    expected = os.getenv("ADMIN_PASSWORD", "admin")
    if email == "" and password == expected:
        return {"token": expected, "role": "sysadmin"}

    if not email or not password:
        raise HTTPException(status_code=401, detail="invalid credentials")

    user = session.exec(select(User).where(User.email == email)).first()
    if not user:
        raise HTTPException(status_code=401, detail="invalid credentials")
    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="invalid credentials")

    token = secrets.token_hex(32)
    row = SessionToken(token=token, user_id=user.id, created_at=datetime.now(timezone.utc), expires_at=None)
    session.add(row)
    session.commit()
    return {"token": token, "role": user.role, "tenant_id": user.tenant_id}


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 150_000)
    return f"pbkdf2_sha256$150000${salt.hex()}${dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        scheme, iters_s, salt_hex, dk_hex = stored.split("$", 3)
        if scheme != "pbkdf2_sha256":
            return False
        iters = int(iters_s)
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(dk_hex)
    except Exception:
        return False
    got = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iters)
    return secrets.compare_digest(got, expected)


@api_router.get("/auth/me")
def auth_me(
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
):
    out: dict = {"id": user.id, "email": user.email, "role": user.role, "tenant_id": user.tenant_id}
    if user.role in ("tenant", "user") and user.tenant_id is not None:
        tr = session.get(Tenant, user.tenant_id)
        out["tenant_coupons_enabled"] = bool(tr.coupons_enabled) if tr else False
    else:
        out["tenant_coupons_enabled"] = None
    return out


@api_router.post("/admin/bootstrap", dependencies=[Depends(require_sysadmin)])
def bootstrap_sysadmin(
    payload: dict,
    session: Annotated[Session, Depends(get_session)],
):
    """
    Create the first sysadmin user (optional).
    If any sysadmin already exists, refuse.
    """
    exists = session.exec(select(User).where(User.role == "sysadmin")).first()
    if exists:
        raise HTTPException(status_code=409, detail="sysadmin already exists")
    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", ""))
    if not email or not password:
        raise HTTPException(status_code=400, detail="email/password required")
    row = User(email=email, password_hash=hash_password(password), role="sysadmin", tenant_id=None)
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@api_router.get("/admin/tenants", dependencies=[Depends(require_sysadmin)])
def list_tenants(session: Annotated[Session, Depends(get_session)]):
    return session.exec(select(Tenant).order_by(Tenant.created_at.desc())).all()


@api_router.post("/admin/tenants", dependencies=[Depends(require_sysadmin)])
def create_tenant(payload: dict, session: Annotated[Session, Depends(get_session)]):
    name = str(payload.get("name", "")).strip()
    if not name:
        raise HTTPException(status_code=400, detail="name required")
    now = datetime.now(timezone.utc)
    row = Tenant(name=name, coupons_enabled=False, created_at=now, updated_at=now)
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@api_router.patch("/admin/tenants/{tenant_id}", dependencies=[Depends(require_sysadmin)])
def patch_tenant(
    tenant_id: int,
    payload: dict,
    session: Annotated[Session, Depends(get_session)],
):
    """テナント設定の更新（現状は coupons_enabled のみ）。"""
    row = session.get(Tenant, tenant_id)
    if not row:
        raise HTTPException(status_code=404, detail="tenant not found")
    now = datetime.now(timezone.utc)
    if "coupons_enabled" in payload:
        row.coupons_enabled = bool(payload["coupons_enabled"])
    row.updated_at = now
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@api_router.get("/admin/tenants/{tenant_id}")
def get_tenant(
    tenant_id: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
):
    _assert_sysadmin_or_tenant_of_tenant(user, tenant_id)
    row = session.get(Tenant, tenant_id)
    if not row:
        raise HTTPException(status_code=404, detail="tenant not found")
    return row


@api_router.get("/admin/tenants/{tenant_id}/users")
def list_tenant_users(
    tenant_id: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
):
    _assert_sysadmin_or_tenant_of_tenant(user, tenant_id)
    return session.exec(select(User).where(User.tenant_id == tenant_id).order_by(User.created_at.desc())).all()


@api_router.post("/admin/tenants/{tenant_id}/admins")
def create_tenant_admin(
    tenant_id: int,
    payload: dict,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
):
    _assert_sysadmin_or_tenant_of_tenant(user, tenant_id)
    tenant = session.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="tenant not found")
    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", ""))
    if not email or not password:
        raise HTTPException(status_code=400, detail="email/password required")
    now = datetime.now(timezone.utc)
    row = User(email=email, password_hash=hash_password(password), role="tenant", tenant_id=tenant_id, created_at=now, updated_at=now)
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@api_router.post("/admin/tenants/{tenant_id}/users")
def create_tenant_user(
    tenant_id: int,
    payload: dict,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
):
    _assert_sysadmin_or_tenant_of_tenant(user, tenant_id)
    tenant = session.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="tenant not found")
    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", ""))
    if not email or not password:
        raise HTTPException(status_code=400, detail="email/password required")
    now = datetime.now(timezone.utc)
    row = User(email=email, password_hash=hash_password(password), role="user", tenant_id=tenant_id, created_at=now, updated_at=now)
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@api_router.patch("/admin/tenants/{tenant_id}/users/{user_id}")
def update_tenant_user(
    tenant_id: int,
    user_id: int,
    payload: dict,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
):
    _assert_sysadmin_or_tenant_of_tenant(user, tenant_id)
    row = session.get(User, user_id)
    if not row or row.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="user not found")
    email = payload.get("email")
    password = payload.get("password")
    now = datetime.now(timezone.utc)
    changed = False
    if email is not None:
        em = str(email).strip().lower()
        if not em:
            raise HTTPException(status_code=400, detail="email required")
        row.email = em
        changed = True
    if password is not None:
        pw = str(password)
        if pw:
            row.password_hash = hash_password(pw)
            changed = True
    if not changed:
        raise HTTPException(status_code=400, detail="no changes")
    row.updated_at = now
    try:
        session.add(row)
        session.commit()
        session.refresh(row)
    except IntegrityError:
        session.rollback()
        raise HTTPException(status_code=400, detail="email already exists")
    return row


@api_router.delete("/admin/tenants/{tenant_id}/users/{user_id}")
def delete_tenant_user(
    tenant_id: int,
    user_id: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
):
    _assert_sysadmin_or_tenant_of_tenant(user, tenant_id)
    if user.id == user_id:
        raise HTTPException(status_code=400, detail="cannot delete yourself")
    row = session.get(User, user_id)
    if not row or row.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="user not found")
    for st in session.exec(select(SessionToken).where(SessionToken.user_id == user_id)).all():
        session.delete(st)
    session.delete(row)
    session.commit()
    return {"ok": True}


def _sanitize_filename(name: str) -> str:
    name = name.strip().replace("\\", "_").replace("/", "_")
    name = re.sub(r"[^a-zA-Z0-9._-]+", "_", name)
    return name or "file"


@api_router.post("/admin/uploads", dependencies=[Depends(require_campaign_manager)])
async def admin_upload(file: UploadFile):
    if not file.filename:
        raise HTTPException(status_code=400, detail="missing filename")
    # keep simple: accept common images only
    content_type = (file.content_type or "").lower()
    if content_type not in ("image/png", "image/jpeg", "image/webp", "image/gif"):
        raise HTTPException(status_code=400, detail="unsupported content type")

    original = _sanitize_filename(file.filename)
    ext = Path(original).suffix.lower()
    if ext not in (".png", ".jpg", ".jpeg", ".webp", ".gif"):
        raise HTTPException(status_code=400, detail="unsupported file extension")

    key = uuid.uuid4().hex
    saved_name = f"{key}{ext}"
    out_path = UPLOAD_DIR / saved_name

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="empty file")
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="file too large")

    out_path.write_bytes(data)

    return JSONResponse(
        {
            "filename": saved_name,
            "url": f"/uploads/{saved_name}",
            "content_type": content_type,
            "size": len(data),
        }
    )


@api_router.get("/campaigns")
def list_campaigns(
    _session: Annotated[Session, Depends(get_session)],
):
    # 一覧はテナント境界のある GET /api/admin/campaigns を利用してください（公開LPは /api/campaigns/{code} のみ）。
    return []


@api_router.get("/admin/campaigns", dependencies=[Depends(require_campaign_manager)])
def list_admin_campaigns(
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(require_campaign_manager)],
):
    q = select(Campaign).order_by(Campaign.created_at.desc())
    if user.role in ("tenant", "user"):
        if user.tenant_id is None:
            raise HTTPException(status_code=400, detail="user has no tenant")
        q = q.where(Campaign.tenant_id == user.tenant_id)
    return session.exec(q).all()


def _campaign_vote_results_payload(row: Campaign, session: Session) -> dict:
    try:
        products = json.loads(row.products_json or "[]")
    except Exception:
        products = []
    if not isinstance(products, list):
        products = []

    counts: dict[int, int] = {i: 0 for i in range(len(products))}
    votes = session.exec(select(Vote).where(Vote.campaign_id == row.id)).all()
    for v in votes:
        try:
            idxs = json.loads(v.product_indices_json or "[]")
        except Exception:
            continue
        if not isinstance(idxs, list):
            continue
        for raw in idxs:
            if isinstance(raw, int) and raw in counts:
                counts[raw] += 1

    items: list[dict] = []
    for idx in range(len(products)):
        p = products[idx]
        name = f"アイテム {idx + 1}"
        img: str | None = None
        if isinstance(p, dict):
            name = str(p.get("name", "") or "").strip() or name
            for k in ("image1Url", "image2Url", "image3Url"):
                v = p.get(k)
                if v and str(v).strip():
                    img = str(v).strip()
                    break
        elif isinstance(p, str) and p.strip():
            name = p.strip()
        items.append(
            {
                "index": idx,
                "vote_count": counts.get(idx, 0),
                "name": name,
                "image_url": img,
            }
        )
    items.sort(key=lambda x: (-x["vote_count"], x["index"]))
    return {
        "campaign_code": row.code,
        "campaign_name": row.name,
        "total_ballots": len(votes),
        "items": items,
    }


@api_router.get("/admin/campaigns/{code}/vote-results", dependencies=[Depends(require_campaign_manager)])
def campaign_vote_results(
    code: str,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(require_campaign_manager)],
):
    row = session.exec(select(Campaign).where(Campaign.code == code)).first()
    if not row:
        raise HTTPException(status_code=404, detail="not found")
    if user.role in ("tenant", "user") and row.tenant_id != user.tenant_id:
        raise HTTPException(status_code=403, detail="forbidden")
    return _campaign_vote_results_payload(row, session)


@api_router.get("/admin/campaigns/{code}/vote-emails", dependencies=[Depends(require_campaign_manager)])
def export_campaign_vote_emails_csv(
    code: str,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(require_campaign_manager)],
):
    """投票時に登録されたメールアドレスを CSV でダウンロード（1行1投票）。"""
    row = session.exec(select(Campaign).where(Campaign.code == code)).first()
    if not row:
        raise HTTPException(status_code=404, detail="not found")
    if user.role in ("tenant", "user") and row.tenant_id != user.tenant_id:
        raise HTTPException(status_code=403, detail="forbidden")

    votes = session.exec(select(Vote).where(Vote.campaign_id == row.id).order_by(Vote.created_at.asc())).all()
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["email", "voted_at"])
    for v in votes:
        writer.writerow([v.email, v.created_at.isoformat()])
    body = "\ufeff" + buf.getvalue()
    safe_code = re.sub(r"[^a-zA-Z0-9._-]+", "_", code) or "campaign"
    return Response(
        content=body.encode("utf-8"),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{safe_code}-vote-emails.csv"'},
    )


@api_router.get("/campaigns/{code}")
def get_campaign(
    code: str,
    session: Annotated[Session, Depends(get_session)],
):
    row = session.exec(select(Campaign).where(Campaign.code == code)).first()
    if not row:
        raise HTTPException(status_code=404, detail="not found")
    return row


_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class VoteSubmitBody(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    product_indices: list[int] = Field(min_length=1, max_length=10)


@api_router.post("/campaigns/{code}/votes")
def submit_vote(
    code: str,
    body: VoteSubmitBody,
    session: Annotated[Session, Depends(get_session)],
):
    row = session.exec(select(Campaign).where(Campaign.code == code)).first()
    if not row:
        raise HTTPException(status_code=404, detail="not found")
    try:
        products = json.loads(row.products_json or "[]")
    except Exception:
        raise HTTPException(status_code=400, detail="invalid campaign products")
    if not isinstance(products, list):
        raise HTTPException(status_code=400, detail="invalid campaign products")
    n = len(products)
    if n == 0:
        raise HTTPException(status_code=400, detail="no products to vote on")

    k_campaign = _clamp_vote_max_products(row.vote_max_products)
    need = min(k_campaign, n)

    email = body.email.strip().lower()
    if not email or not _EMAIL_RE.match(email):
        raise HTTPException(status_code=400, detail="invalid email")

    idxs = body.product_indices
    if len(idxs) != need:
        raise HTTPException(status_code=400, detail="wrong number of selections")
    if len(set(idxs)) != need:
        raise HTTPException(status_code=400, detail="select different products")
    for i in idxs:
        if not isinstance(i, int) or i < 0 or i >= n:
            raise HTTPException(status_code=400, detail="invalid product index")

    vote = Vote(
        campaign_id=row.id,
        email=email,
        product_indices_json=json.dumps(idxs, ensure_ascii=False),
    )
    session.add(vote)
    session.flush()

    tenant_row = session.get(Tenant, row.tenant_id)
    if tenant_row and not tenant_row.coupons_enabled:
        coupons_linked = []
    else:
        coupons_linked = session.exec(
            select(Coupon).where(Coupon.campaign_id == row.id).order_by(Coupon.id)
        ).all()
    coupon_tokens: list[str] = []
    for cp in coupons_linked:
        tok = secrets.token_urlsafe(32)
        session.add(
            CouponIssue(
                coupon_id=cp.id,
                vote_id=vote.id,
                token=tok,
                email=email,
            ),
        )
        coupon_tokens.append(tok)

    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(status_code=409, detail="already voted with this email")
    session.refresh(vote)
    return {
        "ok": True,
        "thank_you_message": row.thank_you_message,
        "coupon_tokens": coupon_tokens,
    }


@api_router.get("/public/coupon/{token}")
def get_public_coupon_issue(
    token: str,
    session: Annotated[Session, Depends(get_session)],
):
    """発行済みクーポン LP 用（認証不要）。トークンは投票完了時にのみ付与される。"""
    t = (token or "").strip()
    if not t or len(t) > 64:
        raise HTTPException(status_code=404, detail="not found")
    issue = session.exec(select(CouponIssue).where(CouponIssue.token == t)).first()
    if not issue:
        raise HTTPException(status_code=404, detail="not found")
    cp = session.get(Coupon, issue.coupon_id)
    if not cp:
        raise HTTPException(status_code=404, detail="not found")
    ua = issue.used_at
    return {
        "name": cp.name,
        "image_url": cp.image_url,
        "description": cp.description,
        "email": issue.email,
        "used": ua is not None,
        "used_at": ua.isoformat() if ua else None,
    }


@api_router.post("/public/coupon/{token}/use")
def use_public_coupon_issue(
    token: str,
    session: Annotated[Session, Depends(get_session)],
):
    """クーポン利用を記録する（初回のみ used_at をセット。再呼び出しは冪等）。"""
    t = (token or "").strip()
    if not t or len(t) > 64:
        raise HTTPException(status_code=404, detail="not found")
    issue = session.exec(select(CouponIssue).where(CouponIssue.token == t)).first()
    if not issue:
        raise HTTPException(status_code=404, detail="not found")
    now = datetime.now(timezone.utc)
    if issue.used_at is None:
        issue.used_at = now
        session.add(issue)
        session.commit()
        session.refresh(issue)
    ua = issue.used_at
    return {"ok": True, "used_at": ua.isoformat() if ua else None}


@api_router.post("/admin/campaigns", dependencies=[Depends(require_campaign_manager)])
def create_campaign(
    payload: CampaignCreate,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(require_campaign_manager)],
):
    # basic validation: products_json must be JSON
    try:
        json.loads(payload.products_json or "[]")
    except Exception:
        raise HTTPException(status_code=400, detail="products_json must be JSON string")

    exists = session.exec(select(Campaign).where(Campaign.code == payload.code)).first()
    if exists:
        raise HTTPException(status_code=409, detail="code already exists")

    now = datetime.now(timezone.utc)
    data = payload.model_dump()
    data.pop("tenant_id", None)
    if user.role in ("tenant", "user"):
        if user.tenant_id is None:
            raise HTTPException(status_code=400, detail="user has no tenant")
        data["tenant_id"] = user.tenant_id
    elif user.role == "sysadmin":
        tid = payload.tenant_id
        if tid is None:
            raise HTTPException(status_code=400, detail="tenant_id required")
        tenant = session.get(Tenant, tid)
        if not tenant:
            raise HTTPException(status_code=404, detail="tenant not found")
        data["tenant_id"] = tid
    data["lp_background_key"] = _normalize_lp_background_key(data.get("lp_background_key"))
    data["vote_max_products"] = _clamp_vote_max_products(data.get("vote_max_products"))
    row = Campaign(**data, created_at=now, updated_at=now)
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@api_router.patch("/admin/campaigns/{code}", dependencies=[Depends(require_campaign_manager)])
def update_campaign(
    code: str,
    payload: CampaignUpdate,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(require_campaign_manager)],
):
    row = session.exec(select(Campaign).where(Campaign.code == code)).first()
    if not row:
        raise HTTPException(status_code=404, detail="not found")
    if user.role in ("tenant", "user") and row.tenant_id != user.tenant_id:
        raise HTTPException(status_code=403, detail="forbidden")

    data = payload.model_dump(exclude_unset=True)
    if "lp_background_key" in data and data["lp_background_key"] is not None:
        data["lp_background_key"] = _normalize_lp_background_key(str(data["lp_background_key"]))
    if "vote_max_products" in data and data["vote_max_products"] is not None:
        data["vote_max_products"] = _clamp_vote_max_products(int(data["vote_max_products"]))
    if "products_json" in data and data["products_json"] is not None:
        try:
            json.loads(data["products_json"] or "[]")
        except Exception:
            raise HTTPException(status_code=400, detail="products_json must be JSON string")

    for k, v in data.items():
        setattr(row, k, v)
    row.updated_at = datetime.now(timezone.utc)
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@api_router.delete("/admin/campaigns/{code}", dependencies=[Depends(require_campaign_manager)])
def delete_campaign(
    code: str,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(require_campaign_manager)],
):
    row = session.exec(select(Campaign).where(Campaign.code == code)).first()
    if not row:
        raise HTTPException(status_code=404, detail="not found")
    if user.role in ("tenant", "user") and row.tenant_id != user.tenant_id:
        raise HTTPException(status_code=403, detail="forbidden")

    for v in session.exec(select(Vote).where(Vote.campaign_id == row.id)).all():
        session.delete(v)
    session.delete(row)
    session.commit()
    return {"ok": True}


@api_router.delete("/admin/campaigns/{code}/products/{index}", dependencies=[Depends(require_campaign_manager)])
def delete_campaign_product(
    code: str,
    index: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(require_campaign_manager)],
):
    """Remove one product from the campaign's products_json array (0-based index)."""
    row = session.exec(select(Campaign).where(Campaign.code == code)).first()
    if not row:
        raise HTTPException(status_code=404, detail="not found")
    if user.role in ("tenant", "user") and row.tenant_id != user.tenant_id:
        raise HTTPException(status_code=403, detail="forbidden")
    try:
        products = json.loads(row.products_json or "[]")
    except Exception:
        raise HTTPException(status_code=400, detail="invalid products_json")
    if not isinstance(products, list):
        raise HTTPException(status_code=400, detail="invalid products_json")
    if index < 0 or index >= len(products):
        raise HTTPException(status_code=404, detail="product index out of range")
    products.pop(index)
    row.products_json = json.dumps(products, ensure_ascii=False)
    row.updated_at = datetime.now(timezone.utc)
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@api_router.get("/admin/coupons", dependencies=[Depends(require_campaign_manager)])
def list_coupons(
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(require_campaign_manager)],
):
    if user.role in ("tenant", "user"):
        if user.tenant_id is None:
            raise HTTPException(status_code=400, detail="user has no tenant")
        _assert_tenant_coupons_feature(session, user.tenant_id, user)
    q = select(Coupon).order_by(Coupon.created_at.desc())
    if user.role in ("tenant", "user"):
        q = q.where(Coupon.tenant_id == user.tenant_id)
    return session.exec(q).all()


@api_router.post("/admin/coupons", dependencies=[Depends(require_campaign_manager)])
def create_coupon(
    payload: CouponCreate,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(require_campaign_manager)],
):
    name = str(payload.name or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="name required")

    tid: int | None = None
    if user.role in ("tenant", "user"):
        if user.tenant_id is None:
            raise HTTPException(status_code=400, detail="user has no tenant")
        tid = user.tenant_id
    elif user.role == "sysadmin":
        if payload.tenant_id is None:
            raise HTTPException(status_code=400, detail="tenant_id required")
        tenant = session.get(Tenant, payload.tenant_id)
        if not tenant:
            raise HTTPException(status_code=404, detail="tenant not found")
        tid = int(payload.tenant_id)
    else:
        raise HTTPException(status_code=403, detail="forbidden")

    _assert_tenant_coupons_feature(session, tid, user)

    img = str(payload.image_url).strip() if payload.image_url else None
    if img == "":
        img = None
    desc = None
    if payload.description is not None:
        s = str(payload.description).strip()
        desc = s or None

    campaign_id_val = _validate_coupon_campaign_link(session, tid, payload.campaign_id)

    now = datetime.now(timezone.utc)
    row = Coupon(
        tenant_id=tid,
        campaign_id=campaign_id_val,
        name=name,
        image_url=img,
        description=desc,
        created_at=now,
        updated_at=now,
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@api_router.get("/admin/coupons/{coupon_id}", dependencies=[Depends(require_campaign_manager)])
def get_coupon(
    coupon_id: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(require_campaign_manager)],
):
    row = session.get(Coupon, coupon_id)
    if not row:
        raise HTTPException(status_code=404, detail="not found")
    _assert_coupon_access(row, user)
    _assert_tenant_coupons_feature(session, row.tenant_id, user)
    return row


@api_router.get("/admin/coupons/{coupon_id}/issued-csv", dependencies=[Depends(require_campaign_manager)])
def export_coupon_issues_csv(
    coupon_id: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(require_campaign_manager)],
):
    """発行済みクーポン（投票連動で付与されたトークン）を CSV でダウンロード（1行1発行）。"""
    row = session.get(Coupon, coupon_id)
    if not row:
        raise HTTPException(status_code=404, detail="not found")
    _assert_coupon_access(row, user)
    _assert_tenant_coupons_feature(session, row.tenant_id, user)

    issues = session.exec(
        select(CouponIssue)
        .where(CouponIssue.coupon_id == coupon_id)
        .order_by(CouponIssue.created_at.asc())
    ).all()
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["email", "token", "issued_at", "used_at", "vote_id"])
    for it in issues:
        writer.writerow(
            [
                it.email,
                it.token,
                it.created_at.isoformat(),
                it.used_at.isoformat() if it.used_at else "",
                it.vote_id,
            ]
        )
    body = "\ufeff" + buf.getvalue()
    safe = re.sub(r"[^a-zA-Z0-9._-]+", "_", row.name) or f"coupon-{coupon_id}"
    return Response(
        content=body.encode("utf-8"),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{safe}-issued-coupons.csv"'},
    )


@api_router.patch("/admin/coupons/{coupon_id}", dependencies=[Depends(require_campaign_manager)])
def update_coupon(
    coupon_id: int,
    payload: CouponUpdate,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(require_campaign_manager)],
):
    row = session.get(Coupon, coupon_id)
    if not row:
        raise HTTPException(status_code=404, detail="not found")
    _assert_coupon_access(row, user)
    _assert_tenant_coupons_feature(session, row.tenant_id, user)

    data = payload.model_dump(exclude_unset=True)
    if "tenant_id" in data:
        if user.role != "sysadmin":
            data.pop("tenant_id", None)
        elif data.get("tenant_id") is not None:
            tid = int(data["tenant_id"])
            if not session.get(Tenant, tid):
                raise HTTPException(status_code=404, detail="tenant not found")
            data["tenant_id"] = tid

    if "name" in data and data["name"] is not None:
        n = str(data["name"]).strip()
        if not n:
            raise HTTPException(status_code=400, detail="name required")
        data["name"] = n

    if "image_url" in data:
        img = data["image_url"]
        if img is None or (isinstance(img, str) and not str(img).strip()):
            data["image_url"] = None
        elif isinstance(img, str):
            data["image_url"] = str(img).strip() or None

    if "description" in data:
        dr = data["description"]
        if dr is None:
            data["description"] = None
        else:
            s = str(dr).strip()
            data["description"] = s or None

    eff_tid = row.tenant_id
    if "tenant_id" in data and user.role == "sysadmin" and data.get("tenant_id") is not None:
        eff_tid = int(data["tenant_id"])

    if "campaign_id" in data:
        data["campaign_id"] = _validate_coupon_campaign_link(session, eff_tid, data.get("campaign_id"))
    elif "tenant_id" in data and user.role == "sysadmin" and data.get("tenant_id") is not None:
        new_tid = int(data["tenant_id"])
        if row.campaign_id is not None:
            c = session.get(Campaign, row.campaign_id)
            if not c or c.tenant_id != new_tid:
                data["campaign_id"] = None

    if not data:
        return row

    now = datetime.now(timezone.utc)
    for k, v in data.items():
        setattr(row, k, v)
    row.updated_at = now
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


@api_router.delete("/admin/coupons/{coupon_id}", dependencies=[Depends(require_campaign_manager)])
def delete_coupon(
    coupon_id: int,
    session: Annotated[Session, Depends(get_session)],
    user: Annotated[User, Depends(require_campaign_manager)],
):
    row = session.get(Coupon, coupon_id)
    if not row:
        raise HTTPException(status_code=404, detail="not found")
    _assert_coupon_access(row, user)
    _assert_tenant_coupons_feature(session, row.tenant_id, user)
    session.delete(row)
    session.commit()
    return {"ok": True}


app.include_router(api_router)
