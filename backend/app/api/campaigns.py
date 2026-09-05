from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from backend.app.db.session import get_db
from backend.app.models.campaign import Campaign
from backend.app.models.campaign_action import CampaignAction
from backend.app.models.approval import ApprovalRequest
from backend.app.models.strategy import Strategy
from backend.app.models.schemas import CampaignRead, CampaignActionRead, CampaignExecutionRequest, CampaignMetricsRead
from backend.app.services.campaign_service import CampaignExecutionEngine

router = APIRouter(prefix='/campaigns', tags=['Campaigns'])

@router.post('/execute', response_model=CampaignRead)
async def execute_campaign(
    request: CampaignExecutionRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        campaign = await CampaignExecutionEngine.execute_approved_campaign(
            db=db,
            approval_request_id=request.approval_request_id,
            idempotency_key=request.idempotency_key
        )
        return campaign
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

@router.get('/{campaign_id}', response_model=CampaignRead)
async def get_campaign(campaign_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Campaign).where(Campaign.id == campaign_id)
    campaign = (await db.execute(stmt)).scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail='Campaign not found.')
    return campaign

@router.get('/{campaign_id}/actions', response_model=List[CampaignActionRead])
async def get_campaign_actions(
    campaign_id: str,
    limit: int = Query(50, ge=1, le=500),
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(CampaignAction).where(CampaignAction.campaign_id == campaign_id)
    if status:
        stmt = stmt.where(CampaignAction.status == status)
    stmt = stmt.order_by(CampaignAction.created_at.desc()).limit(limit)
    return (await db.execute(stmt)).scalars().all()

@router.get('/{campaign_id}/metrics', response_model=CampaignMetricsRead)
async def get_campaign_metrics(campaign_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Campaign).where(Campaign.id == campaign_id)
    campaign = (await db.execute(stmt)).scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail='Campaign not found.')
        
    app_stmt = (
        select(ApprovalRequest)
        .options(selectinload(ApprovalRequest.strategy))
        .where(ApprovalRequest.id == campaign.approval_request_id)
    )
    approval = (await db.execute(app_stmt)).scalar_one_or_none()
    strategy = approval.strategy if approval else None
    
    # Projected metrics from strategy
    proj_gross = strategy.estimated_gross_revenue if strategy else 0.0
    proj_cost = strategy.estimated_campaign_cost if strategy else 0.0
    proj_lift = strategy.estimated_net_lift if strategy else 0.0
    proj_roi = strategy.projected_roi if strategy else 0.0
    
    conv_rate = round((campaign.conversions_count / campaign.target_count) * 100, 1) if campaign.target_count > 0 else 0.0
    
    return CampaignMetricsRead(
        campaign_id=campaign.id,
        status=campaign.status,
        execution_mode=campaign.execution_mode,
        target_audience=campaign.target_count,
        links_created=campaign.links_created_count,
        conversions_count=campaign.conversions_count,
        conversion_rate_percent=conv_rate,
        projected_gross_revenue=proj_gross,
        projected_campaign_cost=proj_cost,
        projected_net_lift=proj_lift,
        projected_roi=proj_roi,
        actual_gross_revenue=campaign.actual_revenue_generated,
        actual_campaign_cost=campaign.actual_incentive_spent,
        actual_net_lift=campaign.net_revenue_lift,
        actual_roi=campaign.realized_roi,
        currency='INR'
    )
