import uuid
from datetime import datetime
from sqlalchemy import String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base import Base
from backend.app.models.enums import CampaignActionStatus

class CampaignAction(Base):
    __tablename__ = 'campaign_actions'
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    campaign_id: Mapped[str] = mapped_column(String(36), ForeignKey('campaigns.id'), nullable=False, index=True)
    customer_id: Mapped[str] = mapped_column(String(36), ForeignKey('customers.id'), nullable=False, index=True)
    
    # Razorpay / Sandbox Payment Link metadata
    razorpay_payment_link_id: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    razorpay_short_url: Mapped[str] = mapped_column(String(255), nullable=False)
    idempotency_key: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    
    original_amount: Mapped[float] = mapped_column(Float, nullable=False)
    discount_amount: Mapped[float] = mapped_column(Float, default=0.0)
    final_amount: Mapped[float] = mapped_column(Float, nullable=False)
    
    status: Mapped[str] = mapped_column(String(30), default=CampaignActionStatus.SENT.value, index=True)
    failure_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    executed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    campaign = relationship('Campaign', back_populates='actions')
    customer = relationship('Customer')
