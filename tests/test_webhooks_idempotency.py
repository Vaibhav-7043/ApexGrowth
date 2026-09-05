import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.models.merchant import Merchant
from backend.app.models.campaign import Campaign
from backend.app.models.campaign_action import CampaignAction
from backend.app.agents.growth_agent import GrowthAgent
from backend.app.services.approval_service import ApprovalStateMachine
from backend.app.services.campaign_service import CampaignExecutionEngine
from backend.app.services.sandbox_service import SandboxSimulatorService
from backend.app.services.audit_service import AuditService

@pytest.mark.asyncio
async def test_webhook_payment_idempotency(client: AsyncClient, seeded_db: AsyncSession):
    merchant = (await seeded_db.execute(select(Merchant))).scalar_one_or_none()
    assert merchant is not None
    
    # 1. Propose, approve, execute
    result = await GrowthAgent.analyze_and_propose_strategy(db=seeded_db, merchant_id=merchant.id, custom_discount_override=15.0)
    approval = result["approval_request"]
    await ApprovalStateMachine.decide_approval(db=seeded_db, approval_id=approval.id, approved=True)
    campaign = await CampaignExecutionEngine.execute_approved_campaign(db=seeded_db, approval_request_id=approval.id)
    
    # Fetch first action
    action = (await seeded_db.execute(select(CampaignAction).where(CampaignAction.campaign_id == campaign.id))).scalars().first()
    assert action is not None
    
    # 2. Generate realistic Razorpay webhook payload
    payload = SandboxSimulatorService.generate_payment_webhook_payload(
        payment_link_id=action.razorpay_payment_link_id,
        amount_inr=action.final_amount,
        status="captured",
        payment_method="upi"
    )
    
    # 3. First Webhook Post -> Should succeed and attribute revenue
    resp1 = await client.post("/api/webhooks/razorpay", json=payload)
    assert resp1.status_code == 200
    assert resp1.json()["status"] == "processed"
    
    await seeded_db.refresh(campaign)
    first_rev = campaign.actual_revenue_generated
    assert first_rev == action.final_amount
    
    # 4. Duplicate Webhook Post -> Must be idempotent, no double attribution
    resp2 = await client.post("/api/webhooks/razorpay", json=payload)
    assert resp2.status_code == 200
    assert resp2.json()["status"] == "processed"
    assert resp2.json()["result"]["status"] == "already_processed"
    
    # Verify campaign revenue is unchanged
    await seeded_db.refresh(campaign)
    assert campaign.actual_revenue_generated == first_rev
    assert campaign.conversions_count == 1
    
    # Verify Audit Chain remains valid
    verification = await AuditService.verify_chain(seeded_db, merchant.id)
    assert verification.is_valid is True

@pytest.mark.asyncio
async def test_webhook_unknown_payment_link_rejected(client: AsyncClient):
    payload = SandboxSimulatorService.generate_payment_webhook_payload(
        payment_link_id="plink_non_existent_fake_123",
        amount_inr=999.0,
        status="captured"
    )
    resp = await client.post("/api/webhooks/razorpay", json=payload)
    assert resp.status_code == 404

@pytest.mark.asyncio
async def test_webhook_signature_verification_direct():
    import hmac, hashlib
    from backend.app.services.razorpay_service import RazorpayService
    
    secret = "secret_webhook_key_12345"
    payload = '{"event":"payment.captured","payload":{}}'
    
    valid_sig = hmac.new(secret.encode('utf-8'), payload.encode('utf-8'), hashlib.sha256).hexdigest()
    invalid_sig = "fake_invalid_signature_hex"
    
    assert RazorpayService.verify_webhook_signature(payload, valid_sig, secret) is True
    assert RazorpayService.verify_webhook_signature(payload, invalid_sig, secret) is False

@pytest.mark.asyncio
async def test_webhook_payment_failed_event(client: AsyncClient, seeded_db: AsyncSession):
    merchant = (await seeded_db.execute(select(Merchant))).scalar_one_or_none()
    assert merchant is not None
    
    result = await GrowthAgent.analyze_and_propose_strategy(db=seeded_db, merchant_id=merchant.id, custom_discount_override=15.0)
    approval = result["approval_request"]
    await ApprovalStateMachine.decide_approval(db=seeded_db, approval_id=approval.id, approved=True)
    campaign = await CampaignExecutionEngine.execute_approved_campaign(db=seeded_db, approval_request_id=approval.id)
    
    action = (await seeded_db.execute(select(CampaignAction).where(CampaignAction.campaign_id == campaign.id))).scalars().first()
    assert action is not None
    
    payload = {
        "event": "payment.failed",
        "payload": {
            "payment_link": {
                "entity": {"id": action.razorpay_payment_link_id}
            },
            "payment": {
                "entity": {
                    "id": "pay_fail_123",
                    "error_code": "BAD_REQUEST_ERROR",
                    "error_description": "Payment authorization declined by issuing bank."
                }
            }
        }
    }
    
    resp = await client.post("/api/webhooks/razorpay", json=payload)
    assert resp.status_code == 200
    assert resp.json()["status"] == "processed"
    assert resp.json()["result"]["status"] == "failed"
    
    await seeded_db.refresh(action)
    assert action.status == "failed"
    assert "BAD_REQUEST_ERROR" in action.failure_reason
