from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.db.session import get_db
from backend.app.models.merchant import Merchant
from backend.app.models.policy_config import PolicyConfig
from backend.app.models.schemas import PolicyConfigRead, PolicyConfigUpdate
from backend.app.services.policy_service import PolicyService
from backend.app.api.auth import get_current_user_and_merchant

router = APIRouter(prefix='/policies', tags=['Policies'])

@router.get('/current', response_model=PolicyConfigRead)
async def get_current_policy(
    authorization: str | None = Header(None),
    db: AsyncSession = Depends(get_db)
):
    user, merchant = await get_current_user_and_merchant(authorization, db)
    if not merchant:
        merchant = (await db.execute(select(Merchant).limit(1))).scalar_one_or_none()
    if not merchant:
        raise HTTPException(status_code=404, detail='No merchant found.')
    return await PolicyService.get_or_create_policy(db, merchant.id)

@router.put('/current', response_model=PolicyConfigRead)
async def update_policy(
    update_data: PolicyConfigUpdate,
    authorization: str | None = Header(None),
    db: AsyncSession = Depends(get_db)
):
    user, merchant = await get_current_user_and_merchant(authorization, db)
    if not merchant:
        merchant = (await db.execute(select(Merchant).limit(1))).scalar_one_or_none()
    if not merchant:
        raise HTTPException(status_code=404, detail='No merchant found.')
        
    policy = await PolicyService.get_or_create_policy(db, merchant.id)
    
    if update_data.max_discount_percent is not None:
        policy.max_discount_percent = update_data.max_discount_percent
    if update_data.max_campaign_audience is not None:
        policy.max_campaign_audience = update_data.max_campaign_audience
    if update_data.max_budget_inr is not None:
        policy.max_budget_inr = update_data.max_budget_inr
    if update_data.cooldown_days_per_customer is not None:
        policy.cooldown_days_per_customer = update_data.cooldown_days_per_customer
    if update_data.require_manual_approval_above_inr is not None:
        policy.require_manual_approval_above_inr = update_data.require_manual_approval_above_inr
        
    await db.commit()
    await db.refresh(policy)
    return policy
