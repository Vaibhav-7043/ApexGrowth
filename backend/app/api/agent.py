from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.db.session import get_db
from backend.app.models.merchant import Merchant
from backend.app.models.schemas import StrategyRead, OpportunityRead, ApprovalRequestRead
from backend.app.agents.growth_agent import GrowthAgent

router = APIRouter(prefix='/agent', tags=['AI Growth Agent'])

class ProposeStrategyRequest(BaseModel):
    opportunity_id: Optional[str] = None
    custom_discount_override: Optional[float] = Field(None, ge=1.0, le=100.0)
    custom_audience_override: Optional[int] = Field(None, ge=1, le=10000)

class ProposeStrategyResponse(BaseModel):
    opportunity: OpportunityRead
    strategy: StrategyRead
    approval_request: ApprovalRequestRead
    policy_validation: Dict[str, Any]

@router.post('/propose-strategy', response_model=ProposeStrategyResponse)
async def agent_propose_strategy(
    request: ProposeStrategyRequest,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Merchant).limit(1)
    merchant = (await db.execute(stmt)).scalar_one_or_none()
    if not merchant:
        raise HTTPException(status_code=404, detail='No merchant found.')
        
    try:
        result = await GrowthAgent.analyze_and_propose_strategy(
            db=db,
            merchant_id=merchant.id,
            opportunity_id=request.opportunity_id,
            custom_discount_override=request.custom_discount_override,
            custom_audience_override=request.custom_audience_override
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
