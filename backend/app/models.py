from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, SQLModel


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Tenant(SQLModel, table=True):
    __tablename__ = "tenants"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=200)
    # テナント自体の有効・無効。無効時は当該テナント配下ユーザはログイン不可。
    active: bool = Field(default=True)
    # シスアドがテナント単位でクーポン機能の利用を許可するか（無効時は当該テナント向け管理API・投票時の発行を停止）。既定は OFF。
    coupons_enabled: bool = Field(default=False)
    # テナントあたり作成可能な企画数の上限（シスアドが変更可能）
    max_campaigns: int = Field(default=3)
    # テナントあたり登録できるクーポン（マスタ）数の上限
    max_coupons: int = Field(default=10)
    # 任意（画面入力なし想定。シスアドAPIやDBで設定）
    phone: Optional[str] = Field(default=None, max_length=64)
    address: Optional[str] = Field(default=None, max_length=2000)
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, max_length=254)
    password_hash: str = Field(max_length=500)
    role: str = Field(max_length=32)  # "sysadmin" | "tenant" | "user"
    tenant_id: Optional[int] = Field(default=None, foreign_key="tenants.id", index=True)
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)

    __table_args__ = (UniqueConstraint("email", name="uq_users_email"),)


class SessionToken(SQLModel, table=True):
    __tablename__ = "session_tokens"

    token: str = Field(primary_key=True, max_length=64)
    user_id: int = Field(foreign_key="users.id", index=True)
    created_at: datetime = Field(default_factory=utcnow)
    expires_at: Optional[datetime] = None


class PasswordResetToken(SQLModel, table=True):
    """管理画面ログイン用パスワード再設定。URL に含める UUID を PK とし、発行時刻・使用済み時刻を保持する。"""

    __tablename__ = "password_reset_tokens"

    token: str = Field(primary_key=True, max_length=36)
    user_id: int = Field(foreign_key="users.id", index=True)
    created_at: datetime = Field(default_factory=utcnow, index=True)
    used_at: Optional[datetime] = Field(default=None, index=True)


class CampaignKind(SQLModel, table=True):
    """企画種別マスタ（例: 人気投票）。"""

    __tablename__ = "campaign_kinds"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100, unique=True, index=True)


class CampaignBase(SQLModel):
    code: str = Field(index=True, max_length=64)
    name: str = Field(max_length=200)
    key_visual_url: Optional[str] = Field(default=None, max_length=500)
    key_text: Optional[str] = None
    products_json: str = Field(default="[]")
    thank_you_message: Optional[str] = None
    landing_url: Optional[str] = None
    # ランディングURL未設定時、投票完了後の全画面終了メッセージ（未設定時はLP側デフォルト文言）
    no_landing_end_message: Optional[str] = None
    # LP背景クリエイティブ（パステル系プリセットのキー）
    lp_background_key: str = Field(default="pastel_lavender", max_length=32)
    # LP初回表示モーダル（説明）
    lp_intro_title: Optional[str] = Field(default=None, max_length=200)
    lp_intro_image_url: Optional[str] = Field(default=None, max_length=500)
    lp_intro_text: Optional[str] = None
    # LPで選ぶアイテム数（1〜10、アイテム数が少ない場合はその数まで）
    vote_max_products: int = Field(default=3)
    # 投票前の確認モーダル文言（未設定時はLP側デフォルト）
    vote_confirm_title: Optional[str] = Field(default=None, max_length=200)
    vote_confirm_body: Optional[str] = None
    # 投票時にメールアドレス入力を必須にするか
    email_required: bool = Field(default=True)
    # 公開LPの開催期間（未設定なら常に公開）
    starts_at: Optional[datetime] = Field(default=None)
    ends_at: Optional[datetime] = Field(default=None)


class Campaign(CampaignBase, table=True):
    __tablename__ = "campaigns"

    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int = Field(foreign_key="tenants.id", index=True)
    campaign_kind_id: int = Field(foreign_key="campaign_kinds.id", index=True)
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)


class CampaignProduct(SQLModel, table=True):
    __tablename__ = "campaign_products"
    __table_args__ = (UniqueConstraint("campaign_id", "index", name="uq_campaign_products_campaign_index"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    campaign_id: int = Field(foreign_key="campaigns.id", index=True)
    # 0-based index (matches existing products_json semantics)
    index: int = Field(index=True)
    name: str = Field(default="", max_length=200)
    description: Optional[str] = None
    image1_url: Optional[str] = Field(default=None, max_length=500)
    image2_url: Optional[str] = Field(default=None, max_length=500)
    image3_url: Optional[str] = Field(default=None, max_length=500)
    sort_id: Optional[str] = Field(default=None, max_length=64)


class CampaignCreate(CampaignBase):
    """シスアドが企画を作るときは tenant_id を指定する（テナント配下ユーザはサーバ側で付与）。"""

    tenant_id: Optional[int] = Field(default=None)
    campaign_kind_id: Optional[int] = Field(default=None)


class CampaignUpdate(SQLModel):
    campaign_kind_id: Optional[int] = None
    name: Optional[str] = Field(default=None, max_length=200)
    key_visual_url: Optional[str] = Field(default=None, max_length=500)
    key_text: Optional[str] = None
    products_json: Optional[str] = None
    thank_you_message: Optional[str] = None
    landing_url: Optional[str] = None
    no_landing_end_message: Optional[str] = None
    lp_background_key: Optional[str] = Field(default=None, max_length=32)
    lp_intro_title: Optional[str] = Field(default=None, max_length=200)
    lp_intro_image_url: Optional[str] = Field(default=None, max_length=500)
    lp_intro_text: Optional[str] = None
    vote_max_products: Optional[int] = None
    vote_confirm_title: Optional[str] = Field(default=None, max_length=200)
    vote_confirm_body: Optional[str] = None
    email_required: Optional[bool] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None


class Vote(SQLModel, table=True):
    __tablename__ = "votes"
    __table_args__ = (UniqueConstraint("campaign_id", "email", name="uq_votes_campaign_email"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    campaign_id: int = Field(foreign_key="campaigns.id", index=True)
    email: Optional[str] = Field(default=None, max_length=254)
    product_indices_json: str = Field(default="[]")
    created_at: datetime = Field(default_factory=utcnow)


class VoteItem(SQLModel, table=True):
    __tablename__ = "vote_items"
    __table_args__ = (UniqueConstraint("vote_id", "product_index", name="uq_vote_items_vote_product_index"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    vote_id: int = Field(foreign_key="votes.id", index=True)
    product_index: int = Field(index=True)


class Coupon(SQLModel, table=True):
    __tablename__ = "coupons"

    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int = Field(foreign_key="tenants.id", index=True)
    # 任意。設定時は同一テナントの企画に紐づく
    campaign_id: Optional[int] = Field(default=None, foreign_key="campaigns.id", index=True)
    name: str = Field(max_length=200)
    image_url: Optional[str] = Field(default=None, max_length=500)
    description: Optional[str] = None
    # 公開クーポン LP の見出し（未設定時はフロントのデフォルト文言を表示）
    lp_title: Optional[str] = Field(default=None, max_length=200)
    # 発行開始日 / 利用終了日（未設定なら制限なし）
    issue_starts_at: Optional[datetime] = Field(default=None)
    use_ends_at: Optional[datetime] = Field(default=None)
    # 管理画面向けのテスト用クーポンURLトークン（期間内のみ有効）
    test_token: Optional[str] = Field(default=None, max_length=64, unique=True, index=True)
    # 投票連動で発行できるクーポン（CouponIssue）の上限件数
    max_distribution_count: int = Field(default=10)
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)


class CouponCreate(SQLModel):
    name: str = Field(max_length=200)
    image_url: Optional[str] = Field(default=None, max_length=500)
    description: Optional[str] = None
    lp_title: Optional[str] = Field(default=None, max_length=200)
    issue_starts_at: Optional[datetime] = None
    use_ends_at: Optional[datetime] = None
    test_token: Optional[str] = None
    tenant_id: Optional[int] = None
    campaign_id: Optional[int] = None
    max_distribution_count: Optional[int] = None


class CouponUpdate(SQLModel):
    name: Optional[str] = Field(default=None, max_length=200)
    image_url: Optional[str] = Field(default=None, max_length=500)
    description: Optional[str] = None
    lp_title: Optional[str] = Field(default=None, max_length=200)
    issue_starts_at: Optional[datetime] = None
    use_ends_at: Optional[datetime] = None
    test_token: Optional[str] = None
    tenant_id: Optional[int] = None
    campaign_id: Optional[int] = None
    max_distribution_count: Optional[int] = None


class CouponIssue(SQLModel, table=True):
    """投票に紐づくクーポン発行（URL トークンで個人の LP を開く）。"""

    __tablename__ = "coupon_issues"
    __table_args__ = (UniqueConstraint("vote_id", "coupon_id", name="uq_coupon_issues_vote_coupon"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    coupon_id: int = Field(foreign_key="coupons.id", index=True)
    vote_id: int = Field(foreign_key="votes.id", index=True)
    token: str = Field(max_length=64, unique=True, index=True)
    email: str = Field(max_length=254)
    used_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=utcnow)


# 問い合わせの対応状態（管理画面で変更）
INQUIRY_STATUS_VALUES: frozenset[str] = frozenset({"着信", "処理中", "完了", "対象外"})
INQUIRY_STATUS_DEFAULT = "着信"


class Inquiry(SQLModel, table=True):
    __tablename__ = "inquiries"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(default="", max_length=200)
    email: str = Field(max_length=254, index=True)
    message: str
    status: str = Field(default=INQUIRY_STATUS_DEFAULT, max_length=20)
    created_at: datetime = Field(default_factory=utcnow, index=True)


class AdminOperationLog(SQLModel, table=True):
    """
    管理画面の操作履歴（誰が・どの画面で・何をしたか）。
    トップLP・投票LP・クーポン公開LPは記録対象外とする（アプリ側で書き込まないこと）。
    """

    __tablename__ = "admin_operation_logs"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(default=None, foreign_key="users.id", index=True)
    screen: str = Field(max_length=300, index=True)
    operation: str = Field(max_length=200, index=True)
    api_name: Optional[str] = Field(default=None, max_length=128, index=True)
    detail: Optional[str] = Field(default=None, max_length=8000)
    created_at: datetime = Field(default_factory=utcnow, index=True)


class InquiryCreate(SQLModel):
    name: str = Field(default="", max_length=200)
    email: str = Field(max_length=254)
    message: str

