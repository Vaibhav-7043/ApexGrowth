from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from backend.app.db.session import get_db
from backend.app.config import settings

router = APIRouter(tags=['Health'])

@router.get('/health')
async def health_check(db: AsyncSession = Depends(get_db)):
    db_status = 'healthy'
    try:
        await db.execute(text('SELECT 1'))
    except Exception as e:
        db_status = f'unhealthy: {str(e)}'
        
    return {
        'status': 'ok',
        'database': db_status,
        'environment': settings.ENVIRONMENT,
        'llm_provider': settings.LLM_PROVIDER,
        'razorpay_mode': 'live_test' if settings.RAZORPAY_KEY_ID else 'sandbox_simulator'
    }
