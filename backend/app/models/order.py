import uuid
from datetime import datetime
from sqlalchemy import String, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base import Base
from backend.app.models.enums import OrderStatus

class Order(Base):
    __tablename__ = 'orders'
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    merchant_id: Mapped[str] = mapped_column(String(36), ForeignKey('merchants.id'), nullable=False, index=True)
    customer_id: Mapped[str] = mapped_column(String(36), ForeignKey('customers.id'), nullable=False, index=True)
    
    order_number: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    discount_amount: Mapped[float] = mapped_column(Float, default=0.0)
    final_amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default='INR')
    status: Mapped[str] = mapped_column(String(30), default=OrderStatus.PAID.value, index=True)
    
    # Razorpay Integration fields
    razorpay_order_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    campaign_id: Mapped[str | None] = mapped_column(String(36), ForeignKey('campaigns.id'), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    
    merchant = relationship('Merchant', back_populates='orders')
    customer = relationship('Customer', back_populates='orders')
    payments = relationship('Payment', back_populates='order')
