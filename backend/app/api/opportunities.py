from typing import List
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from backend.app.db.session import get_db
from backend.app.models.opportunity import Opportunity
from backend.app.models.strategy import Strategy
from backend.app.models.merchant import Merchant
from backend.app.models.schemas import OpportunityRead
from backend.app.api.auth import get_current_user_and_merchant

router = APIRouter(prefix='/opportunities', tags=['Opportunities'])

@router.get('/current', response_model=OpportunityRead)
async def get_current_opportunity(
    authorization: str | None = Header(None),
    db: AsyncSession = Depends(get_db)
):
    user, merchant = await get_current_user_and_merchant(authorization, db)
    if not merchant:
        merchant = (await db.execute(select(Merchant).limit(1))).scalar_one_or_none()
    if not merchant:
        raise HTTPException(status_code=404, detail='Merchant not found.')
        
    stmt = (
        select(Opportunity)
        .options(selectinload(Opportunity.strategy).selectinload(Strategy.approval_request))
        .where(and_(Opportunity.merchant_id == merchant.id, Opportunity.status == 'discovered'))
        .order_by(Opportunity.estimated_recoverable_revenue.desc())
        .limit(1)
    )
    result = await db.execute(stmt)
    opp = result.scalar_one_or_none()
    if not opp:
        # Check any status for this merchant
        stmt2 = select(Opportunity).options(selectinload(Opportunity.strategy).selectinload(Strategy.approval_request)).where(Opportunity.merchant_id == merchant.id).order_by(Opportunity.created_at.desc()).limit(1)
        opp = (await db.execute(stmt2)).scalar_one_or_none()
        
    if not opp:
        raise HTTPException(status_code=404, detail='No growth opportunities found for merchant.')
    return opp

@router.get('', response_model=List[OpportunityRead])
async def list_opportunities(
    authorization: str | None = Header(None),
    db: AsyncSession = Depends(get_db)
):
    user, merchant = await get_current_user_and_merchant(authorization, db)
    if not merchant:
        merchant = (await db.execute(select(Merchant).limit(1))).scalar_one_or_none()
    if not merchant:
        return []
        
    stmt = select(Opportunity).options(selectinload(Opportunity.strategy).selectinload(Strategy.approval_request)).where(Opportunity.merchant_id == merchant.id).order_by(Opportunity.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()
