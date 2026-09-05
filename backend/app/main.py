from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.db.session import init_db, async_session_factory
from backend.app.services.seed_service import SeedService
from backend.app.models.merchant import Merchant
from sqlalchemy import select
from backend.app.api import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schemas
    await init_db()
    # Auto-seed if database is empty on start
    async with async_session_factory() as session:
        stmt = select(Merchant).limit(1)
        res = await session.execute(stmt)
        if res.scalar_one_or_none() is None:
            await SeedService.reset_and_seed(session)
    yield

app = FastAPI(
    title='AI Revenue Growth Agent API',
    description='Razorpay AI Buildathon 2026 - Track 1 Backend Core',
    version='1.0.0',
    lifespan=lifespan
)

default_origins = [
    'https://vaibhav-7043.github.io',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
]

if settings.EXTRA_ALLOWED_ORIGINS:
    extra = [o.strip() for o in settings.EXTRA_ALLOWED_ORIGINS.split(',') if o.strip()]
    default_origins.extend(extra)

app.add_middleware(
    CORSMiddleware,
    allow_origins=default_origins,
    allow_origin_regex=r'https://.*\.github\.io|https://.*\.onrender\.com',
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(api_router)

if __name__ == '__main__':
    import uvicorn
    uvicorn.run('backend.app.main:app', host='0.0.0.0', port=settings.PORT, reload=True)
