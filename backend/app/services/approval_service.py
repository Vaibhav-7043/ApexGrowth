from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.models.approval import ApprovalRequest
from backend.app.models.strategy import Strategy
from backend.app.models.opportunity import Opportunity
from backend.app.models.merchant import Merchant
from backend.app.models.enums import ApprovalStatus, OpportunityStatus, ActorType
from backend.app.services.audit_service import AuditService

ALLOWED_TRANSITIONS = {
    ApprovalStatus.DRAFT.value: {ApprovalStatus.POLICY_VALIDATED.value, ApprovalStatus.POLICY_BLOCKED.value},
    ApprovalStatus.POLICY_VALIDATED.value: {ApprovalStatus.PENDING_APPROVAL.value},
    ApprovalStatus.POLICY_BLOCKED.value: {ApprovalStatus.DRAFT.value, ApprovalStatus.REJECTED.value},
    ApprovalStatus.PENDING_APPROVAL.value: {ApprovalStatus.APPROVED.value, ApprovalStatus.REJECTED.value},
    ApprovalStatus.APPROVED.value: {ApprovalStatus.EXECUTING.value},
    ApprovalStatus.REJECTED.value: set(),
    ApprovalStatus.EXECUTING.value: {ApprovalStatus.COMPLETED.value, ApprovalStatus.FAILED.value},
    ApprovalStatus.COMPLETED.value: set(),
    ApprovalStatus.FAILED.value: set()
}

class ApprovalStateMachine:
    @staticmethod
    def can_transition(current_status: str, target_status: str) -> bool:
        allowed = ALLOWED_TRANSITIONS.get(current_status, set())
        return target_status in allowed

    @staticmethod
    async def decide_approval(
        db: AsyncSession,
        approval_id: str,
        approved: bool,
        decided_by: str = "merchant_admin",
        rejection_reason: Optional[str] = None
    ) -> ApprovalRequest:
        stmt = select(ApprovalRequest).where(ApprovalRequest.id == approval_id)
        result = await db.execute(stmt)
        approval = result.scalar_one_or_none()
        
        if not approval:
            raise ValueError(f"Approval request {approval_id} not found.")
            
        current_status = approval.status
        target_status = ApprovalStatus.APPROVED.value if approved else ApprovalStatus.REJECTED.value
        
        # Enforce that blocked policies cannot be approved directly
        if approved and not approval.policy_checks_passed:
            raise ValueError("Cannot approve a strategy that failed deterministic policy checks.")
            
        if not ApprovalStateMachine.can_transition(current_status, target_status):
            # Log invalid state transition attempt to audit trail
            strat_stmt = select(Strategy).where(Strategy.id == approval.strategy_id)
            strategy = (await db.execute(strat_stmt)).scalar_one_or_none()
            if strategy:
                opp_stmt = select(Opportunity).where(Opportunity.id == strategy.opportunity_id)
                opp = (await db.execute(opp_stmt)).scalar_one_or_none()
                if opp:
                    await AuditService.log_event(
                        db=db,
                        merchant_id=opp.merchant_id,
                        actor_type=ActorType.MERCHANT.value,
                        actor_id=decided_by,
                        action="INVALID_STATE_TRANSITION_BLOCKED",
                        target_type="approval_request",
                        target_id=approval.id,
                        summary=f"Illegal transition blocked: {current_status} -> {target_status}",
                        details={"current_status": current_status, "target_status": target_status},
                        policy_passed=False
                    )
            raise ValueError(f"Invalid state transition: cannot transition from '{current_status}' to '{target_status}'.")
            
        # Execute valid transition
        approval.status = target_status
        approval.decided_at = datetime.utcnow()
        approval.decided_by = decided_by
        approval.rejection_reason = rejection_reason if not approved else None
        
        # Fetch related opportunity to update status and merchant_id for audit
        strat_stmt = select(Strategy).where(Strategy.id == approval.strategy_id)
        strategy = (await db.execute(strat_stmt)).scalar_one_or_none()
        opp_stmt = select(Opportunity).where(Opportunity.id == strategy.opportunity_id)
        opportunity = (await db.execute(opp_stmt)).scalar_one_or_none()
        
        if approved:
            opportunity.status = OpportunityStatus.APPROVED.value
        else:
            opportunity.status = OpportunityStatus.DISMISSED.value
            
        await db.commit()
        await db.refresh(approval)
        
        # Log audit trail event
        action_name = "MERCHANT_APPROVAL_GRANTED" if approved else "MERCHANT_APPROVAL_REJECTED"
        summary_text = (
            f"Merchant approved strategy {strategy.id} for execution."
            if approved else
            f"Merchant rejected strategy {strategy.id}. Reason: {rejection_reason or 'None given'}"
        )
        
        await AuditService.log_event(
            db=db,
            merchant_id=opportunity.merchant_id,
            actor_type=ActorType.MERCHANT.value,
            actor_id=decided_by,
            action=action_name,
            target_type="approval_request",
            target_id=approval.id,
            summary=summary_text,
            details={
                "approval_id": approval.id,
                "strategy_id": strategy.id,
                "decision": target_status,
                "decided_by": decided_by,
                "rejection_reason": rejection_reason
            },
            policy_passed=True
        )
        
        return approval
