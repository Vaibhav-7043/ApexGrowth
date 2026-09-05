import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.db.session import get_db
from backend.app.models.campaign_action import CampaignAction
from backend.app.models.schemas import PaymentSimulationRequest, PaymentSimulationResponse
from backend.app.services.attribution_service import AttributionService

router = APIRouter(prefix='/sandbox', tags=['Sandbox Simulator'])

@router.post('/payments/simulate', response_model=PaymentSimulationResponse)
async def simulate_payment(
    request: PaymentSimulationRequest,
    db: AsyncSession = Depends(get_db)
):
    # Fetch action by ID or payment_link_id
    stmt = (
        select(CampaignAction)
        .where(
            (CampaignAction.id == request.action_id) | 
            (CampaignAction.razorpay_payment_link_id == request.action_id)
        )
    )
    action = (await db.execute(stmt)).scalar_one_or_none()
    if not action:
        raise HTTPException(status_code=404, detail=f'Campaign action \'{request.action_id}\' not found.')
        
    event_type = request.event_type.upper()
    
    if event_type == 'SUCCESS':
        payment_id = f'pay_sim_{uuid.uuid4().hex[:12]}'
        result = await AttributionService.process_payment_success(
            db=db,
            razorpay_payment_link_id=action.razorpay_payment_link_id,
            payment_id=payment_id,
            amount_paid_inr=action.final_amount,
            payment_method=request.payment_method
        )
        return PaymentSimulationResponse(
            status=result.get('status', 'success'),
            action_id=action.id,
            event_type='SUCCESS',
            payment_id=payment_id,
            attributed_revenue=result.get('attributed_revenue', action.final_amount),
            campaign_id=action.campaign_id,
            message=result.get('message', f'Successfully simulated customer payment of INR {action.final_amount:,.2f} via {request.payment_method}.')
        )
        
    elif event_type == 'FAILURE':
        result = await AttributionService.process_payment_failure(
            db=db,
            razorpay_payment_link_id=action.razorpay_payment_link_id,
            error_code='BAD_REQUEST_ERROR',
            error_description=request.failure_reason or 'Customer bank server unavailable / insufficient funds.'
        )
        return PaymentSimulationResponse(
            status='failed',
            action_id=action.id,
            event_type='FAILURE',
            payment_id=None,
            attributed_revenue=0.0,
            campaign_id=action.campaign_id,
            message='Successfully simulated failed payment event.'
        )
        
    elif event_type == 'EXPIRED':
        result = await AttributionService.process_payment_expired(
            db=db,
            razorpay_payment_link_id=action.razorpay_payment_link_id
        )
        return PaymentSimulationResponse(
            status='expired',
            action_id=action.id,
            event_type='EXPIRED',
            payment_id=None,
            attributed_revenue=0.0,
            campaign_id=action.campaign_id,
            message='Successfully simulated payment link expiration event.'
        )
    else:
        raise HTTPException(status_code=400, detail=f'Invalid event_type \'{request.event_type}\'. Use SUCCESS, FAILURE, or EXPIRED.')
