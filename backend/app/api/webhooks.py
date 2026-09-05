from fastapi import APIRouter, Depends, Request, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.db.session import get_db
from backend.app.config import settings
from backend.app.services.razorpay_service import RazorpayService
from backend.app.services.attribution_service import AttributionService

router = APIRouter(prefix='/webhooks', tags=['Webhooks'])

@router.post('/razorpay')
async def handle_razorpay_webhook(
    request: Request,
    x_razorpay_signature: str | None = Header(None),
    db: AsyncSession = Depends(get_db)
):
    body_bytes = await request.body()
    body_str = body_bytes.decode('utf-8')
    
    # Signature verification if webhook secret is configured
    if settings.RAZORPAY_WEBHOOK_SECRET and x_razorpay_signature:
        if not RazorpayService.verify_webhook_signature(body_str, x_razorpay_signature, settings.RAZORPAY_WEBHOOK_SECRET):
            raise HTTPException(status_code=400, detail='Invalid webhook signature')
            
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail='Invalid JSON payload')
        
    event_name = data.get('event')
    payload = data.get('payload', {})
    
    if event_name in ['payment_link.paid', 'payment.captured']:
        plink = payload.get('payment_link', {}).get('entity', {})
        payment = payload.get('payment', {}).get('entity', {})
        
        plink_id = plink.get('id')
        payment_id = payment.get('id') or f'pay_{plink_id}'
        amount_paise = payment.get('amount') or plink.get('amount') or 0
        amount_inr = amount_paise / 100.0
        method = payment.get('method', 'upi')
        
        if not plink_id:
            raise HTTPException(status_code=400, detail='Missing payment_link.entity.id in webhook payload')
            
        try:
            res = await AttributionService.process_payment_success(
                db=db,
                razorpay_payment_link_id=plink_id,
                payment_id=payment_id,
                amount_paid_inr=amount_inr,
                payment_method=method
            )
            return {'status': 'processed', 'result': res}
        except ValueError as ve:
            raise HTTPException(status_code=404, detail=str(ve))
            
    elif event_name == 'payment.failed':
        payment = payload.get('payment', {}).get('entity', {})
        plink = payload.get('payment_link', {}).get('entity', {})
        plink_id = plink.get('id')
        error_code = payment.get('error_code', 'PAYMENT_FAILED')
        error_desc = payment.get('error_description', 'Payment failed upstream')
        
        if plink_id:
            try:
                res = await AttributionService.process_payment_failure(
                    db=db,
                    razorpay_payment_link_id=plink_id,
                    error_code=error_code,
                    error_description=error_desc
                )
                return {'status': 'processed', 'result': res}
            except ValueError as ve:
                raise HTTPException(status_code=404, detail=str(ve))
                
    return {'status': 'ignored', 'event': event_name}
