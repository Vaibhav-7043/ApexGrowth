from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from backend.app.db.session import get_db
from backend.app.models.customer import Customer
from backend.app.models.merchant import Merchant
from backend.app.models.schemas import CustomerRead
from backend.app.api.auth import get_current_user_and_merchant

router = APIRouter(prefix='/customers', tags=['Customers'])

@router.get('', response_model=List[CustomerRead])
async def list_customers(
    segment: Optional[str] = Query(None, description='Filter by RFM segment'),
    limit: int = Query(50, ge=1, le=250),
    authorization: str | None = Header(None),
    db: AsyncSession = Depends(get_db)
):
    user, merchant = await get_current_user_and_merchant(authorization, db)
    if not merchant:
        merchant = (await db.execute(select(Merchant).limit(1))).scalar_one_or_none()
        
    if not merchant:
        return []
        
    stmt = select(Customer).where(Customer.merchant_id == merchant.id)
    if segment:
        stmt = stmt.where(Customer.rfm_segment == segment)
    stmt = stmt.order_by(Customer.total_spend.desc()).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()
