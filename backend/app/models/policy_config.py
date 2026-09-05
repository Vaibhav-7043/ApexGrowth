import uuid
from datetime import datetime
from sqlalchemy import String, Float, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base import Base

class PolicyConfig(Base):
    __tablename__ = 'policy_configs'
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    merchant_id: Mapped[str] = mapped_column(String(36), ForeignKey('merchants.id'), nullable=False, unique=True)
    
    max_discount_percent: Mapped[float] = mapped_column(Float, default=20.0)
    max_campaign_audience: Mapped[int] = mapped_column(Integer, default=500)
    max_budget_inr: Mapped[float] = mapped_column(Float, default=50000.0)
    cooldown_days_per_customer: Mapped[int] = mapped_column(Integer, default=14)
    require_manual_approval_above_inr: Mapped[float] = mapped_column(Float, default=5000.0)
    
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    merchant = relationship('Merchant', back_populates='policy_config')
