"""normalize campaign products and vote items

Revision ID: 20260425_000018
Revises: 20260425_000017
Create Date: 2026-04-25

"""

from __future__ import annotations

import json
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.sql import text

revision: str = "20260425_000018"
down_revision: Union[str, None] = "20260425_000017"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _as_str(v) -> str:
    if v is None:
        return ""
    return str(v)


def upgrade() -> None:
    op.create_table(
        "campaign_products",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("campaign_id", sa.Integer(), sa.ForeignKey("campaigns.id"), nullable=False),
        sa.Column("index", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False, server_default=""),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("image1_url", sa.String(length=500), nullable=True),
        sa.Column("image2_url", sa.String(length=500), nullable=True),
        sa.Column("image3_url", sa.String(length=500), nullable=True),
        sa.Column("sort_id", sa.String(length=64), nullable=True),
        sa.UniqueConstraint("campaign_id", "index", name="uq_campaign_products_campaign_index"),
    )
    op.create_index("ix_campaign_products_campaign_id", "campaign_products", ["campaign_id"])
    op.create_index("ix_campaign_products_index", "campaign_products", ["index"])

    op.create_table(
        "vote_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("vote_id", sa.Integer(), sa.ForeignKey("votes.id"), nullable=False),
        sa.Column("product_index", sa.Integer(), nullable=False),
        sa.UniqueConstraint("vote_id", "product_index", name="uq_vote_items_vote_product_index"),
    )
    op.create_index("ix_vote_items_vote_id", "vote_items", ["vote_id"])
    op.create_index("ix_vote_items_product_index", "vote_items", ["product_index"])

    # Data migration: campaigns.products_json -> campaign_products
    bind = op.get_bind()
    campaigns = bind.execute(text("SELECT id, products_json FROM campaigns ORDER BY id")).fetchall()
    for (cid, products_json) in campaigns:
        raw = products_json or "[]"
        try:
            products = json.loads(raw)
        except Exception:
            products = []
        if not isinstance(products, list):
            products = []
        for idx, p in enumerate(products):
            name = ""
            desc = None
            img1 = img2 = img3 = None
            sort_id = None
            if isinstance(p, dict):
                name = _as_str(p.get("name", "")).strip()
                desc_raw = p.get("description")
                desc = _as_str(desc_raw) if desc_raw is not None else None
                img1 = _as_str(p.get("image1Url")).strip() or None
                img2 = _as_str(p.get("image2Url")).strip() or None
                img3 = _as_str(p.get("image3Url")).strip() or None
                sort_id = _as_str(p.get("sortId")).strip() or None
            elif isinstance(p, str):
                name = p.strip()
            bind.execute(
                text(
                    """
                    INSERT INTO campaign_products
                      (campaign_id, "index", name, description, image1_url, image2_url, image3_url, sort_id)
                    VALUES
                      (:cid, :idx, :name, :desc, :img1, :img2, :img3, :sort_id)
                    """
                ),
                {
                    "cid": cid,
                    "idx": idx,
                    "name": name,
                    "desc": desc,
                    "img1": img1,
                    "img2": img2,
                    "img3": img3,
                    "sort_id": sort_id,
                },
            )

    # Data migration: votes.product_indices_json -> vote_items
    votes = bind.execute(text("SELECT id, product_indices_json FROM votes ORDER BY id")).fetchall()
    for (vid, idx_json) in votes:
        raw = idx_json or "[]"
        try:
            idxs = json.loads(raw)
        except Exception:
            idxs = []
        if not isinstance(idxs, list):
            continue
        seen = set()
        for it in idxs:
            if not isinstance(it, int):
                continue
            if it in seen:
                continue
            seen.add(it)
            bind.execute(
                text(
                    """
                    INSERT INTO vote_items (vote_id, product_index)
                    VALUES (:vid, :pidx)
                    ON CONFLICT (vote_id, product_index) DO NOTHING
                    """
                ),
                {"vid": vid, "pidx": it},
            )


def downgrade() -> None:
    op.drop_index("ix_vote_items_product_index", table_name="vote_items")
    op.drop_index("ix_vote_items_vote_id", table_name="vote_items")
    op.drop_table("vote_items")

    op.drop_index("ix_campaign_products_index", table_name="campaign_products")
    op.drop_index("ix_campaign_products_campaign_id", table_name="campaign_products")
    op.drop_table("campaign_products")

