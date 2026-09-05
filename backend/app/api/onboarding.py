from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.db.session import get_db
from backend.app.api.auth import get_current_user_and_merchant
from backend.app.models.schemas import BusinessSetupRequest, ConnectRazorpayRequest, OnboardingStatusRead, MerchantRead, UserRead
from backend.app.models.merchant import Merchant
from backend.app.models.user import User

router = APIRouter(prefix='/onboarding', tags=['Onboarding'])

@router.get('/status', response_model=OnboardingStatusRead)
async def get_onboarding_status(
    authorization: str | None = Header(None),
    db: AsyncSession = Depends(get_db)
):
    user, merchant = await get_current_user_and_merchant(authorization, db)
    if not user:
        raise HTTPException(status_code=401, detail='Authentication required.')
        
    step = 5 if user.is_onboarded else 2
    return OnboardingStatusRead(
        step=step,
        is_completed=user.is_onboarded,
        merchant=MerchantRead.model_validate(merchant) if merchant else None
    )

@router.post('/business', response_model=MerchantRead)
async def setup_business(
    request: BusinessSetupRequest,
    authorization: str | None = Header(None),
    db: AsyncSession = Depends(get_db)
):
    user, merchant = await get_current_user_and_merchant(authorization, db)
    if not user:
        raise HTTPException(status_code=401, detail='Authentication required.')
    if not merchant:
        raise HTTPException(status_code=404, detail='Merchant account not found.')
        
    merchant.name = request.name.strip()
    merchant.category = request.category
    merchant.business_type = request.category
    merchant.website = request.website.strip() if request.website else None
    
    await db.commit()
    await db.refresh(merchant)
    return MerchantRead.model_validate(merchant)

@router.post('/connect-razorpay', response_model=MerchantRead)
async def connect_razorpay(
    request: ConnectRazorpayRequest,
    authorization: str | None = Header(None),
    db: AsyncSession = Depends(get_db)
):
    user, merchant = await get_current_user_and_merchant(authorization, db)
    if not user:
        raise HTTPException(status_code=401, detail='Authentication required.')
    if not merchant:
        raise HTTPException(status_code=404, detail='Merchant account not found.')
        
    merchant.is_razorpay_connected = True
    await db.commit()
    await db.refresh(merchant)
    return MerchantRead.model_validate(merchant)

@router.post('/sync')
async def sync_data(
    authorization: str | None = Header(None),
    db: AsyncSession = Depends(get_db)
):
    user, merchant = await get_current_user_and_merchant(authorization, db)
    if not user:
        raise HTTPException(status_code=401, detail='Authentication required.')
    if not merchant:
        raise HTTPException(status_code=404, detail='Merchant account not found.')
        
    return {
        'status': 'success',
        'message': 'Connected stores and payments synchronized.',
        'merchant_id': merchant.id,
        'razorpay_mode': 'test'
    }

@router.post('/complete', response_model=UserRead)
async def complete_onboarding(
    authorization: str | None = Header(None),
    db: AsyncSession = Depends(get_db)
):
    user, merchant = await get_current_user_and_merchant(authorization, db)
    if not user:
        raise HTTPException(status_code=401, detail='Authentication required.')
        
    user.is_onboarded = True
    await db.commit()
    await db.refresh(user)
    return UserRead.model_validate(user)
