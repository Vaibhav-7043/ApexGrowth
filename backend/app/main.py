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

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(api_router)

if __name__ == '__main__':
    import uvicorn
    uvicorn.run('backend.app.main:app', host='0.0.0.0', port=settings.PORT, reload=True)
