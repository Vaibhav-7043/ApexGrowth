import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, JSON, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base import Base

class Merchant(Base):
    __tablename__ = 'merchants'
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    business_type: Mapped[str] = mapped_column(String(100), default='Retail')
    category: Mapped[str | None] = mapped_column(String(100), default='Retail')
    website: Mapped[str | None] = mapped_column(String(255), nullable=True)
    currency: Mapped[str] = mapped_column(String(10), default='INR')
    contact_email: Mapped[str] = mapped_column(String(150), nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    is_razorpay_connected: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    settings: Mapped[dict] = mapped_column(JSON, default=dict)
    
    user = relationship('User', back_populates='merchants')
    customers = relationship('Customer', back_populates='merchant', cascade='all, delete-orphan')
    orders = relationship('Order', back_populates='merchant', cascade='all, delete-orphan')
    opportunities = relationship('Opportunity', back_populates='merchant', cascade='all, delete-orphan')
    campaigns = relationship('Campaign', back_populates='merchant', cascade='all, delete-orphan')
    policy_config = relationship('PolicyConfig', back_populates='merchant', uselist=False, cascade='all, delete-orphan')
