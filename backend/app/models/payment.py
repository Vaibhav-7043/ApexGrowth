import uuid
from datetime import datetime
from sqlalchemy import String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base import Base
from backend.app.models.enums import PaymentStatus

class Payment(Base):
    __tablename__ = 'payments'
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id: Mapped[str] = mapped_column(String(36), ForeignKey('orders.id'), nullable=False, index=True)
    razorpay_payment_id: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default='INR')
    method: Mapped[str] = mapped_column(String(50), default='upi') # upi, card, netbanking, wallet
    status: Mapped[str] = mapped_column(String(30), default=PaymentStatus.CAPTURED.value)
    
    fee: Mapped[float] = mapped_column(Float, default=0.0)
    tax: Mapped[float] = mapped_column(Float, default=0.0)
    error_code: Mapped[str | None] = mapped_column(String(100), nullable=True)
    error_description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    raw_payload: Mapped[dict] = mapped_column(JSON, default=dict)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    order = relationship('Order', back_populates='payments')
