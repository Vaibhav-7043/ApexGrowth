from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.db.session import get_db
from backend.app.models.merchant import Merchant
from backend.app.models.schemas import AnalyticsOverview
from backend.app.services.analytics_service import AnalyticsService
from backend.app.api.auth import get_current_user_and_merchant

router = APIRouter(prefix='/analytics', tags=['Analytics'])

@router.get('/overview', response_model=AnalyticsOverview)
async def get_analytics_overview(
    authorization: str | None = Header(None),
    db: AsyncSession = Depends(get_db)
):
    user, merchant = await get_current_user_and_merchant(authorization, db)
    if not merchant:
        stmt = select(Merchant).limit(1)
        result = await db.execute(stmt)
        merchant = result.scalar_one_or_none()
        
    if not merchant:
        raise HTTPException(status_code=404, detail='No merchant found. Please seed database first.')
    return await AnalyticsService.get_overview(db, merchant.id)
