import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.models.merchant import Merchant
from backend.app.models.approval import ApprovalRequest
from backend.app.models.campaign import Campaign
from backend.app.models.campaign_action import CampaignAction
from backend.app.models.policy_config import PolicyConfig
from backend.app.models.enums import ApprovalStatus, CampaignStatus
from backend.app.agents.growth_agent import GrowthAgent
from backend.app.services.approval_service import ApprovalStateMachine
from backend.app.services.campaign_service import CampaignExecutionEngine
from backend.app.services.audit_service import AuditService

@pytest.mark.asyncio
async def test_approved_campaign_execution_success(seeded_db: AsyncSession):
    merchant = (await seeded_db.execute(select(Merchant))).scalar_one_or_none()
    assert merchant is not None
    
    # 1. Propose strategy
    result = await GrowthAgent.analyze_and_propose_strategy(
        db=seeded_db,
        merchant_id=merchant.id,
        custom_discount_override=15.0
    )
    approval: ApprovalRequest = result["approval_request"]
    
    # 2. Approve strategy
    approved_req = await ApprovalStateMachine.decide_approval(
        db=seeded_db,
        approval_id=approval.id,
        approved=True,
        decided_by="merchant_founder"
    )
    assert approved_req.status == ApprovalStatus.APPROVED.value
    
    # 3. Execute campaign
    campaign = await CampaignExecutionEngine.execute_approved_campaign(
        db=seeded_db,
        approval_request_id=approved_req.id,
        idempotency_key="idemp_test_exec_001"
    )
    
    assert campaign.status == CampaignStatus.RUNNING.value
    assert campaign.target_count == 42
    assert campaign.links_created_count == 42
    assert campaign.conversions_count == 0
    assert campaign.actual_revenue_generated == 0.0
    assert campaign.execution_mode in ["razorpay_test", "sandbox_simulator"]
    
    # Verify campaign actions created
    actions = (await seeded_db.execute(select(CampaignAction).where(CampaignAction.campaign_id == campaign.id))).scalars().all()
    assert len(actions) == 42
    for action in actions:
        assert action.razorpay_payment_link_id.startswith("plink_")
        assert action.status == "sent"
        assert action.original_amount > 0
        assert action.final_amount < action.original_amount
        
    # Verify approval status moved to EXECUTING
    await seeded_db.refresh(approved_req)
    assert approved_req.status == ApprovalStatus.EXECUTING.value
    
    # Verify audit chain integrity
    verification = await AuditService.verify_chain(seeded_db, merchant.id)
    assert verification.is_valid is True

@pytest.mark.asyncio
async def test_campaign_execution_idempotency(seeded_db: AsyncSession):
    merchant = (await seeded_db.execute(select(Merchant))).scalar_one_or_none()
    assert merchant is not None
    
    result = await GrowthAgent.analyze_and_propose_strategy(
        db=seeded_db,
        merchant_id=merchant.id,
        custom_discount_override=12.0
    )
    approval: ApprovalRequest = result["approval_request"]
    await ApprovalStateMachine.decide_approval(db=seeded_db, approval_id=approval.id, approved=True)
    
    # First execution
    camp1 = await CampaignExecutionEngine.execute_approved_campaign(
        db=seeded_db,
        approval_request_id=approval.id,
        idempotency_key="idemp_repeat_key"
    )
    
    # Second execution attempt with identical parameters
    camp2 = await CampaignExecutionEngine.execute_approved_campaign(
        db=seeded_db,
        approval_request_id=approval.id,
        idempotency_key="idemp_repeat_key"
    )
    
    assert camp1.id == camp2.id
    
    # Verify no duplicate actions created
    actions = (await seeded_db.execute(select(CampaignAction).where(CampaignAction.campaign_id == camp1.id))).scalars().all()
    assert len(actions) == 42

@pytest.mark.asyncio
async def test_campaign_execution_fails_without_approval(seeded_db: AsyncSession):
    merchant = (await seeded_db.execute(select(Merchant))).scalar_one_or_none()
    assert merchant is not None
    
    result = await GrowthAgent.analyze_and_propose_strategy(
        db=seeded_db,
        merchant_id=merchant.id,
        custom_discount_override=10.0
    )
    approval: ApprovalRequest = result["approval_request"]
    assert approval.status == ApprovalStatus.PENDING_APPROVAL.value
    
    # Attempt to execute unapproved request
    with pytest.raises(ValueError) as excinfo:
        await CampaignExecutionEngine.execute_approved_campaign(
            db=seeded_db,
            approval_request_id=approval.id
        )
    assert "Approval status is 'pending_approval', expected 'approved'" in str(excinfo.value)

@pytest.mark.asyncio
async def test_campaign_execution_policy_revalidation_failure(seeded_db: AsyncSession):
    merchant = (await seeded_db.execute(select(Merchant))).scalar_one_or_none()
    assert merchant is not None
    
    # 1. Propose strategy at 18% discount (Policy limit is 20%)
    result = await GrowthAgent.analyze_and_propose_strategy(
        db=seeded_db,
        merchant_id=merchant.id,
        custom_discount_override=18.0
    )
    approval: ApprovalRequest = result["approval_request"]
    
    # 2. Approve strategy
    await ApprovalStateMachine.decide_approval(db=seeded_db, approval_id=approval.id, approved=True)
    
    # 3. Policy changes in the interim before execution: max discount reduced to 10%
    pol_stmt = select(PolicyConfig).where(PolicyConfig.merchant_id == merchant.id)
    policy = (await seeded_db.execute(pol_stmt)).scalar_one()
    policy.max_discount_percent = 10.0
    await seeded_db.commit()
    
    # 4. Attempt execution -> Policy revalidation must intercept and block
    with pytest.raises(ValueError) as excinfo:
        await CampaignExecutionEngine.execute_approved_campaign(
            db=seeded_db,
            approval_request_id=approval.id
        )
    assert "Policy revalidation failed" in str(excinfo.value)
    
    # Verify approval status transitioned to policy_blocked
    await seeded_db.refresh(approval)
    assert approval.status == ApprovalStatus.POLICY_BLOCKED.value
