import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from backend.app.models.merchant import Merchant
from backend.app.models.approval import ApprovalRequest
from backend.app.models.opportunity import Opportunity
from backend.app.models.strategy import Strategy
from backend.app.models.enums import ApprovalStatus, OpportunityStatus
from backend.app.agents.growth_agent import GrowthAgent
from backend.app.services.approval_service import ApprovalStateMachine
from backend.app.services.audit_service import AuditService

@pytest.mark.asyncio
async def test_valid_approval_flow(seeded_db: AsyncSession):
    merchant = (await seeded_db.execute(select(Merchant))).scalar_one_or_none()
    assert merchant is not None
    
    # 1. Generate strategy
    result = await GrowthAgent.analyze_and_propose_strategy(
        db=seeded_db,
        merchant_id=merchant.id,
        custom_discount_override=12.0
    )
    approval: ApprovalRequest = result["approval_request"]
    assert approval.status == ApprovalStatus.PENDING_APPROVAL.value
    
    # 2. Merchant Approves
    decided_approval = await ApprovalStateMachine.decide_approval(
        db=seeded_db,
        approval_id=approval.id,
        approved=True,
        decided_by="merchant_founder"
    )
    
    assert decided_approval.status == ApprovalStatus.APPROVED.value
    assert decided_approval.decided_by == "merchant_founder"
    assert decided_approval.decided_at is not None
    
    # Verify opportunity status updated
    opp = (await seeded_db.execute(select(Opportunity).where(Opportunity.merchant_id == merchant.id))).scalar_one_or_none()
    assert opp.status == OpportunityStatus.APPROVED.value
    
    # Verify Audit trail
    verification = await AuditService.verify_chain(seeded_db, merchant.id)
    assert verification.is_valid is True

@pytest.mark.asyncio
async def test_valid_rejection_flow(seeded_db: AsyncSession):
    merchant = (await seeded_db.execute(select(Merchant))).scalar_one_or_none()
    assert merchant is not None
    
    # 1. Generate strategy
    result = await GrowthAgent.analyze_and_propose_strategy(
        db=seeded_db,
        merchant_id=merchant.id,
        custom_discount_override=10.0
    )
    approval: ApprovalRequest = result["approval_request"]
    
    # 2. Merchant Rejects with comment
    decided_approval = await ApprovalStateMachine.decide_approval(
        db=seeded_db,
        approval_id=approval.id,
        approved=False,
        decided_by="merchant_founder",
        rejection_reason="Prefer targeting new customer segment first."
    )
    
    assert decided_approval.status == ApprovalStatus.REJECTED.value
    assert decided_approval.rejection_reason == "Prefer targeting new customer segment first."

@pytest.mark.asyncio
async def test_illegal_state_transition_blocked(seeded_db: AsyncSession):
    merchant = (await seeded_db.execute(select(Merchant))).scalar_one_or_none()
    assert merchant is not None
    
    # 1. Generate strategy
    result = await GrowthAgent.analyze_and_propose_strategy(
        db=seeded_db,
        merchant_id=merchant.id,
        custom_discount_override=10.0
    )
    approval: ApprovalRequest = result["approval_request"]
    
    # 2. Reject it first
    await ApprovalStateMachine.decide_approval(
        db=seeded_db,
        approval_id=approval.id,
        approved=False,
        rejection_reason="Test rejection"
    )
    
    # 3. Attempt to approve a rejected request (Illegal transition: REJECTED -> APPROVED)
    with pytest.raises(ValueError) as excinfo:
        await ApprovalStateMachine.decide_approval(
            db=seeded_db,
            approval_id=approval.id,
            approved=True
        )
    assert "Invalid state transition" in str(excinfo.value)

@pytest.mark.asyncio
async def test_approved_to_approved_duplicate_transition_blocked(seeded_db: AsyncSession):
    merchant = (await seeded_db.execute(select(Merchant))).scalar_one_or_none()
    assert merchant is not None
    
    # 1. Propose strategy
    result = await GrowthAgent.analyze_and_propose_strategy(
        db=seeded_db,
        merchant_id=merchant.id,
        custom_discount_override=14.0
    )
    approval: ApprovalRequest = result["approval_request"]
    assert approval.status == ApprovalStatus.PENDING_APPROVAL.value
    
    # 2. Approve it
    first_decision = await ApprovalStateMachine.decide_approval(
        db=seeded_db,
        approval_id=approval.id,
        approved=True,
        decided_by="merchant_founder"
    )
    assert first_decision.status == ApprovalStatus.APPROVED.value
    
    # 3. Attempt second approve (Simulating repeated click / un-synchronized UI)
    with pytest.raises(ValueError) as excinfo:
        await ApprovalStateMachine.decide_approval(
            db=seeded_db,
            approval_id=approval.id,
            approved=True,
            decided_by="merchant_founder"
        )
    assert "cannot transition from 'approved' to 'approved'" in str(excinfo.value)

@pytest.mark.asyncio
async def test_approved_to_rejected_transition_blocked(seeded_db: AsyncSession):
    merchant = (await seeded_db.execute(select(Merchant))).scalar_one_or_none()
    assert merchant is not None
    
    # 1. Propose strategy
    result = await GrowthAgent.analyze_and_propose_strategy(
        db=seeded_db,
        merchant_id=merchant.id,
        custom_discount_override=14.0
    )
    approval: ApprovalRequest = result["approval_request"]
    
    # 2. Approve it
    await ApprovalStateMachine.decide_approval(
        db=seeded_db,
        approval_id=approval.id,
        approved=True,
        decided_by="merchant_founder"
    )
    
    # 3. Attempt to reject after already approved
    with pytest.raises(ValueError) as excinfo:
        await ApprovalStateMachine.decide_approval(
            db=seeded_db,
            approval_id=approval.id,
            approved=False,
            decided_by="merchant_founder"
        )
    assert "cannot transition from 'approved' to 'rejected'" in str(excinfo.value)

@pytest.mark.asyncio
async def test_opportunity_eagerloads_approval_request(seeded_db: AsyncSession):
    merchant = (await seeded_db.execute(select(Merchant))).scalar_one_or_none()
    assert merchant is not None
    
    # 1. Propose strategy
    await GrowthAgent.analyze_and_propose_strategy(
        db=seeded_db,
        merchant_id=merchant.id,
        custom_discount_override=15.0
    )
    
    # 2. Query opportunity with nested strategy and approval_request
    stmt = (
        select(Opportunity)
        .options(selectinload(Opportunity.strategy).selectinload(Strategy.approval_request))
        .where(Opportunity.merchant_id == merchant.id)
    )
    opp = (await seeded_db.execute(stmt)).scalar_one_or_none()
    assert opp is not None
    assert opp.strategy is not None
    assert opp.strategy.approval_request is not None
    assert opp.strategy.approval_request.status == ApprovalStatus.PENDING_APPROVAL.value
