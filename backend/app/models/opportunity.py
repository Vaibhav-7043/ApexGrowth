import uuid
from datetime import datetime
from sqlalchemy import String, Float, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base import Base
from backend.app.models.enums import OpportunityType, OpportunityStatus

class Opportunity(Base):
    __tablename__ = 'opportunities'
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    merchant_id: Mapped[str] = mapped_column(String(36), ForeignKey('merchants.id'), nullable=False, index=True)
    
    type: Mapped[str] = mapped_column(String(50), default=OpportunityType.INACTIVE_RETENTION.value)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    summary: Mapped[str] = mapped_column(String(500), nullable=False)
    target_segment: Mapped[str] = mapped_column(String(50), nullable=False)
    
    # Grounded metrics (calculated deterministically, not guessed)
    target_customer_count: Mapped[int] = mapped_column(Integer, default=0)
    total_historical_spend: Mapped[float] = mapped_column(Float, default=0.0)
    average_customer_aov: Mapped[float] = mapped_column(Float, default=0.0)
    estimated_recoverable_revenue: Mapped[float] = mapped_column(Float, default=0.0)
    urgency: Mapped[str] = mapped_column(String(20), default='HIGH') # HIGH, MEDIUM, LOW
    
    status: Mapped[str] = mapped_column(String(30), default=OpportunityStatus.DISCOVERED.value)
    evidence: Mapped[dict] = mapped_column(JSON, default=dict)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    merchant = relationship('Merchant', back_populates='opportunities')
    strategy = relationship('Strategy', back_populates='opportunity', uselist=False, cascade='all, delete-orphan')
