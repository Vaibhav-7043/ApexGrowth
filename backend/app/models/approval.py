import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base import Base
from backend.app.models.enums import ApprovalStatus

class ApprovalRequest(Base):
    __tablename__ = 'approval_requests'
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    strategy_id: Mapped[str] = mapped_column(String(36), ForeignKey('strategies.id'), nullable=False, unique=True)
    
    status: Mapped[str] = mapped_column(String(30), default=ApprovalStatus.PENDING_APPROVAL.value)
    policy_checks_passed: Mapped[bool] = mapped_column(Boolean, default=False)
    policy_validation_report: Mapped[dict] = mapped_column(JSON, default=dict)
    
    requested_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    decided_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    decided_by: Mapped[str | None] = mapped_column(String(100), nullable=True) # e.g. 'merchant_admin'
    rejection_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    strategy = relationship('Strategy', back_populates='approval_request')
    campaign = relationship('Campaign', back_populates='approval_request', uselist=False)
