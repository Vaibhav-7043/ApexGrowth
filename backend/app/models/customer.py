import uuid
from datetime import datetime
from sqlalchemy import String, Float, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base import Base
from backend.app.models.enums import CustomerSegment

class Customer(Base):
    __tablename__ = 'customers'
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    merchant_id: Mapped[str] = mapped_column(String(36), ForeignKey('merchants.id'), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(150), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=True)
    
    # Behavioral & RFM metrics
    total_spend: Mapped[float] = mapped_column(Float, default=0.0)
    order_count: Mapped[int] = mapped_column(Integer, default=0)
    average_order_value: Mapped[float] = mapped_column(Float, default=0.0)
    first_order_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_order_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    days_since_last_order: Mapped[int] = mapped_column(Integer, default=0)
    
    # Derived segmentation & risk
    rfm_segment: Mapped[str] = mapped_column(String(50), default=CustomerSegment.NEW_CUSTOMERS.value, index=True)
    churn_risk_score: Mapped[float] = mapped_column(Float, default=0.0) # 0.0 to 1.0
    last_incentive_sent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    merchant = relationship('Merchant', back_populates='customers')
    orders = relationship('Order', back_populates='customer')
