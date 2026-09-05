import uuid
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.db.session import get_db
from backend.app.models.user import User
from backend.app.models.merchant import Merchant
from backend.app.models.policy_config import PolicyConfig
from backend.app.models.schemas import UserRegisterRequest, UserLoginRequest, UserRead, AuthResponse, MerchantRead
from backend.app.services.auth_service import SecurityService

router = APIRouter(prefix='/auth', tags=['Authentication'])

async def get_current_user_and_merchant(
    authorization: str | None = Header(None),
    db: AsyncSession = Depends(get_db)
) -> tuple[User | None, Merchant | None]:
    if not authorization or not authorization.startswith('Bearer '):
        return None, None
    token = authorization.split(' ')[1]
    payload = SecurityService.verify_token(token)
    if not payload:
        return None, None
    
    user_id = payload.get('user_id')
    user_stmt = select(User).where(User.id == user_id)
    user = (await db.execute(user_stmt)).scalar_one_or_none()
    if not user:
        return None, None
        
    merchant_id = payload.get('merchant_id')
    if merchant_id:
        m_stmt = select(Merchant).where(Merchant.id == merchant_id)
        merchant = (await db.execute(m_stmt)).scalar_one_or_none()
    else:
        m_stmt = select(Merchant).where(Merchant.user_id == user.id)
        merchant = (await db.execute(m_stmt)).scalar_one_or_none()
        
    return user, merchant

@router.post('/register', response_model=AuthResponse)
async def register(request: UserRegisterRequest, db: AsyncSession = Depends(get_db)):
    email_clean = request.email.strip().lower()
    if not email_clean or '@' not in email_clean:
        raise HTTPException(status_code=400, detail='Please provide a valid email address.')
    if len(request.password) < 6:
        raise HTTPException(status_code=400, detail='Password must be at least 6 characters.')
        
    # Check duplicate email
    stmt = select(User).where(User.email == email_clean)
    existing = (await db.execute(stmt)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail='An account with this email already exists. Please sign in.')
        
    pwd_hash, salt = SecurityService.hash_password(request.password)
    user_id = str(uuid.uuid4())
    merchant_id = str(uuid.uuid4())
    
    user = User(
        id=user_id,
        email=email_clean,
        full_name=request.full_name.strip(),
        password_hash=pwd_hash,
        password_salt=salt,
        is_onboarded=False
    )
    db.add(user)
    
    merchant = Merchant(
        id=merchant_id,
        user_id=user_id,
        name=f"{request.full_name.strip()}'s Store",
        business_type='Retail',
        category='Retail',
        currency='INR',
        contact_email=email_clean,
        is_demo=False,
        is_razorpay_connected=False
    )
    db.add(merchant)
    
    # Initialize default safety policy
    policy = PolicyConfig(
        id=str(uuid.uuid4()),
        merchant_id=merchant_id,
        max_discount_percent=20.0,
        max_campaign_audience=500,
        max_budget_inr=50000.0,
        cooldown_days_per_customer=14,
        require_manual_approval_above_inr=5000.0
    )
    db.add(policy)
    
    await db.commit()
    await db.refresh(user)
    await db.refresh(merchant)
    
    token = SecurityService.create_token(user.id, user.email, merchant.id)
    return AuthResponse(
        token=token,
        user=UserRead.model_validate(user),
        merchant=MerchantRead.model_validate(merchant)
    )

@router.post('/login', response_model=AuthResponse)
async def login(request: UserLoginRequest, db: AsyncSession = Depends(get_db)):
    email_clean = request.email.strip().lower()
    stmt = select(User).where(User.email == email_clean)
    user = (await db.execute(stmt)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail='Email or password is incorrect.')
        
    if not SecurityService.verify_password(request.password, user.password_hash, user.password_salt):
        raise HTTPException(status_code=401, detail='Email or password is incorrect.')
        
    m_stmt = select(Merchant).where(Merchant.user_id == user.id)
    merchant = (await db.execute(m_stmt)).scalar_one_or_none()
    if not merchant:
        # Fallback to first merchant if user was demo user
        merchant = (await db.execute(select(Merchant).limit(1))).scalar_one_or_none()
        
    token = SecurityService.create_token(user.id, user.email, merchant.id if merchant else None)
    return AuthResponse(
        token=token,
        user=UserRead.model_validate(user),
        merchant=MerchantRead.model_validate(merchant) if merchant else None
    )

@router.post('/demo-login', response_model=AuthResponse)
async def demo_login(db: AsyncSession = Depends(get_db)):
    # Find demo merchant (Artisan Roasters Co.)
    m_stmt = select(Merchant).where(Merchant.name.ilike('%Artisan Roasters%'))
    merchant = (await db.execute(m_stmt)).scalar_one_or_none()
    if not merchant:
        merchant = (await db.execute(select(Merchant).limit(1))).scalar_one_or_none()
    if not merchant:
        raise HTTPException(status_code=404, detail='Demo merchant not found. Please seed the database.')
        
    demo_email = 'merchant@artisanroasters.in'
    u_stmt = select(User).where(User.email == demo_email)
    user = (await db.execute(u_stmt)).scalar_one_or_none()
    
    if not user:
        pwd_hash, salt = SecurityService.hash_password('password123')
        user = User(
            id=str(uuid.uuid4()),
            email=demo_email,
            full_name='Artisan Founder',
            password_hash=pwd_hash,
            password_salt=salt,
            is_onboarded=True
        )
        db.add(user)
        merchant.user_id = user.id
        await db.commit()
        await db.refresh(user)
        await db.refresh(merchant)
        
    token = SecurityService.create_token(user.id, user.email, merchant.id)
    return AuthResponse(
        token=token,
        user=UserRead.model_validate(user),
        merchant=MerchantRead.model_validate(merchant)
    )

@router.get('/me', response_model=AuthResponse)
async def get_current_user_profile(
    authorization: str | None = Header(None),
    db: AsyncSession = Depends(get_db)
):
    user, merchant = await get_current_user_and_merchant(authorization, db)
    if not user:
        raise HTTPException(status_code=401, detail='Authentication required or session expired.')
    token = authorization.split(' ')[1]
    return AuthResponse(
        token=token,
        user=UserRead.model_validate(user),
        merchant=MerchantRead.model_validate(merchant) if merchant else None
    )
