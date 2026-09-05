import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.models.merchant import Merchant
from backend.app.models.approval import ApprovalRequest
from backend.app.models.enums import ApprovalStatus
from backend.app.agents.growth_agent import GrowthAgent
from backend.app.services.approval_service import ApprovalStateMachine
from backend.app.services.audit_service import AuditService

@pytest.mark.asyncio
async def test_failure_scenario_excessive_discount_blocked_safely(seeded_db: AsyncSession):
    merchant = (await seeded_db.execute(select(Merchant))).scalar_one_or_none()
    assert merchant is not None
    
    # 1. Trigger strategy generation with an illegal 40% discount (Policy limit is 20%)
    result = await GrowthAgent.analyze_and_propose_strategy(
        db=seeded_db,
        merchant_id=merchant.id,
        custom_discount_override=40.0
    )
    
    approval: ApprovalRequest = result["approval_request"]
    validation = result["policy_validation"]
    
    # Assert policy engine caught the violation
    assert validation["passed"] is False
    assert any("exceeds policy maximum limit of 20" in v for v in validation["violations"])
    
    # Assert state machine set status to POLICY_BLOCKED
    assert approval.status == ApprovalStatus.POLICY_BLOCKED.value
    assert approval.policy_checks_passed is False
    
    # Assert that approving a policy-blocked request is strictly forbidden
    with pytest.raises(ValueError) as excinfo:
        await ApprovalStateMachine.decide_approval(
            db=seeded_db,
            approval_id=approval.id,
            approved=True
        )
    assert "Cannot approve a strategy that failed deterministic policy checks" in str(excinfo.value)
    
    # Assert audit trail recorded the violation event and hash-chain remains valid
    verification = await AuditService.verify_chain(seeded_db, merchant.id)
    assert verification.is_valid is True
