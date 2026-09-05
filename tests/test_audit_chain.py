import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.models.merchant import Merchant
from backend.app.models.audit_event import AuditEvent
from backend.app.services.audit_service import AuditService

@pytest.mark.asyncio
async def test_audit_chain_integrity(seeded_db: AsyncSession):
    merchant = (await seeded_db.execute(select(Merchant))).scalar_one_or_none()
    assert merchant is not None
    
    # Verify seeded audit chain is cryptographically valid
    verification = await AuditService.verify_chain(seeded_db, merchant.id)
    assert verification.is_valid is True
    assert verification.total_events >= 2
    assert verification.genesis_hash is not None
    assert verification.latest_hash is not None
    assert verification.error_message is None

@pytest.mark.asyncio
async def test_audit_chain_tamper_detection(seeded_db: AsyncSession):
    merchant = (await seeded_db.execute(select(Merchant))).scalar_one_or_none()
    assert merchant is not None
    
    # Add a new event
    event = await AuditService.log_event(
        db=seeded_db,
        merchant_id=merchant.id,
        actor_type="merchant",
        actor_id="test_user",
        action="POLICY_LIMIT_CHANGED",
        target_type="policy",
        target_id="pol_1",
        summary="Changed max discount to 18%",
        details={"old": 20.0, "new": 18.0}
    )
    
    # Verify chain is valid
    ver1 = await AuditService.verify_chain(seeded_db, merchant.id)
    assert ver1.is_valid is True
    
    # Intentionally tamper with the event payload in the database
    event.summary = "TAMPERED ILLEGAL MODIFICATION"
    await seeded_db.commit()
    
    # Verify chain detects payload tampering immediately
    ver2 = await AuditService.verify_chain(seeded_db, merchant.id)
    assert ver2.is_valid is False
    assert ver2.tampered_event_id == event.id
    assert "tamper detected" in ver2.error_message.lower()
