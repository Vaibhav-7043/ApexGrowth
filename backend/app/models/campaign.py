import uuid
from datetime import datetime
from sqlalchemy import String, Float, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base import Base
from backend.app.models.enums import CampaignStatus

class Campaign(Base):
    __tablename__ = 'campaigns'
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    merchant_id: Mapped[str] = mapped_column(String(36), ForeignKey('merchants.id'), nullable=False, index=True)
    approval_request_id: Mapped[str] = mapped_column(String(36), ForeignKey('approval_requests.id'), nullable=False, unique=True)
    
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default=CampaignStatus.RUNNING.value)
    execution_mode: Mapped[str] = mapped_column(String(30), default='sandbox_simulator') # razorpay_test, sandbox_simulator
    idempotency_key: Mapped[str | None] = mapped_column(String(100), nullable=True, unique=True, index=True)
    
    # Audience & Conversion tracking
    target_count: Mapped[int] = mapped_column(Integer, default=0)
    links_created_count: Mapped[int] = mapped_column(Integer, default=0)
    conversions_count: Mapped[int] = mapped_column(Integer, default=0)
    
    # Deterministic Actual Financial Metrics (vs Projected)
    budget_cap: Mapped[float] = mapped_column(Float, default=0.0)
    actual_incentive_spent: Mapped[float] = mapped_column(Float, default=0.0)
    actual_revenue_generated: Mapped[float] = mapped_column(Float, default=0.0)
    net_revenue_lift: Mapped[float] = mapped_column(Float, default=0.0)
    realized_roi: Mapped[float] = mapped_column(Float, default=0.0)
    
    execution_details: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    merchant = relationship('Merchant', back_populates='campaigns')
    approval_request = relationship('ApprovalRequest', back_populates='campaign')
    actions = relationship('CampaignAction', back_populates='campaign', cascade='all, delete-orphan')
