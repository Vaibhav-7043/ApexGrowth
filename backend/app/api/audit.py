from typing import List
from fastapi import APIRouter, Depends, Query, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.db.session import get_db
from backend.app.models.merchant import Merchant
from backend.app.models.audit_event import AuditEvent
from backend.app.models.schemas import AuditEventRead, AuditChainVerification
from backend.app.services.audit_service import AuditService
from backend.app.api.auth import get_current_user_and_merchant

router = APIRouter(prefix='/audit', tags=['Audit Ledger'])

@router.get('/events', response_model=List[AuditEventRead])
async def get_audit_events(
    limit: int = Query(100, ge=1, le=500),
    authorization: str | None = Header(None),
    db: AsyncSession = Depends(get_db)
):
    user, merchant = await get_current_user_and_merchant(authorization, db)
    if not merchant:
        merchant = (await db.execute(select(Merchant).limit(1))).scalar_one_or_none()
    if not merchant:
        return []
        
    stmt = (
        select(AuditEvent)
        .where(AuditEvent.merchant_id == merchant.id)
        .order_by(AuditEvent.sequence_number.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get('/verify', response_model=AuditChainVerification)
async def verify_audit_chain(
    authorization: str | None = Header(None),
    db: AsyncSession = Depends(get_db)
):
    user, merchant = await get_current_user_and_merchant(authorization, db)
    if not merchant:
        merchant = (await db.execute(select(Merchant).limit(1))).scalar_one_or_none()
    if not merchant:
        raise HTTPException(status_code=404, detail='No merchant found to verify.')
    return await AuditService.verify_chain(db=db, merchant_id=merchant.id)
