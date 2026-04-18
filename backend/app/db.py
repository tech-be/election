import os

from sqlmodel import Session, SQLModel, create_engine


def get_database_url() -> str:
    url = os.getenv("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL is not set")
    return url


engine = create_engine(get_database_url(), pool_pre_ping=True)


def get_session():
    with Session(engine) as session:
        yield session

