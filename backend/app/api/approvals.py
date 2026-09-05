from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.db.session import get_db
from backend.app.models.approval import ApprovalRequest
from backend.app.models.schemas import ApprovalRequestRead, ApprovalDecisionRequest
from backend.app.services.approval_service import ApprovalStateMachine

router = APIRouter(prefix='/approvals', tags=['Human Approvals'])

@router.get('/{approval_id}', response_model=ApprovalRequestRead)
async def get_approval_request(approval_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(ApprovalRequest).where(ApprovalRequest.id == approval_id)
    approval = (await db.execute(stmt)).scalar_one_or_none()
    if not approval:
        raise HTTPException(status_code=404, detail='Approval request not found.')
    return approval

@router.post('/{approval_id}/decide', response_model=ApprovalRequestRead)
async def decide_approval_request(
    approval_id: str,
    decision: ApprovalDecisionRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        updated_approval = await ApprovalStateMachine.decide_approval(
            db=db,
            approval_id=approval_id,
            approved=decision.approved,
            decided_by=decision.decided_by,
            rejection_reason=decision.rejection_reason
        )
        return updated_approval
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
