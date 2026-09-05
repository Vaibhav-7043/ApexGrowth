import uuid
from datetime import datetime
from sqlalchemy import String, Float, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base import Base

class Strategy(Base):
    __tablename__ = 'strategies'
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    opportunity_id: Mapped[str] = mapped_column(String(36), ForeignKey('opportunities.id'), nullable=False, unique=True)
    
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    action_type: Mapped[str] = mapped_column(String(100), default='razorpay_payment_link_incentive')
    
    # Bounded parameters
    proposed_discount_percent: Mapped[float] = mapped_column(Float, nullable=False)
    validity_hours: Mapped[int] = mapped_column(Integer, default=72)
    min_order_amount: Mapped[float] = mapped_column(Float, default=0.0)
    target_audience_count: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # Deterministically calculated financial projections
    estimated_campaign_cost: Mapped[float] = mapped_column(Float, default=0.0)
    estimated_gross_revenue: Mapped[float] = mapped_column(Float, default=0.0)
    estimated_net_lift: Mapped[float] = mapped_column(Float, default=0.0)
    projected_roi: Mapped[float] = mapped_column(Float, default=0.0) # e.g. 8.4x
    
    # Reasoning & transparency
    why_explanation: Mapped[dict] = mapped_column(JSON, default=dict)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    opportunity = relationship('Opportunity', back_populates='strategy')
    approval_request = relationship('ApprovalRequest', back_populates='strategy', uselist=False, cascade='all, delete-orphan')
