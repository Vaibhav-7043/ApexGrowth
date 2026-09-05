from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.db.session import get_db
from backend.app.models.merchant import Merchant
from backend.app.models.schemas import MerchantRead
from backend.app.api.auth import get_current_user_and_merchant

router = APIRouter(prefix='/merchants', tags=['Merchants'])

@router.get('/current', response_model=MerchantRead)
async def get_current_merchant(
    authorization: str | None = Header(None),
    db: AsyncSession = Depends(get_db)
):
    user, merchant = await get_current_user_and_merchant(authorization, db)
    if merchant:
        return merchant
        
    stmt = select(Merchant).limit(1)
    result = await db.execute(stmt)
    merchant = result.scalar_one_or_none()
    if not merchant:
        raise HTTPException(status_code=404, detail='No merchant found. Please seed the database.')
    return merchant
