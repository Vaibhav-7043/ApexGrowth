import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from backend.app.config import settings
from backend.app.db.base import Base

# Ensure SQLite directory exists if local file path
if settings.DATABASE_URL.startswith("sqlite"):
    db_file_path = settings.DATABASE_URL.split(":///")[-1]
    if db_file_path and not db_file_path.startswith(":memory:"):
        os.makedirs(os.path.dirname(os.path.abspath(db_file_path)), exist_ok=True)

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=(settings.ENVIRONMENT == 'development' and False),
    future=True
)

async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
