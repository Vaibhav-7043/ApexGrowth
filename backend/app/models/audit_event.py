import uuid
import hashlib
import json
from datetime import datetime
from sqlalchemy import String, Integer, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.db.base import Base

class AuditEvent(Base):
    __tablename__ = 'audit_events'
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    merchant_id: Mapped[str] = mapped_column(String(36), ForeignKey('merchants.id'), nullable=False, index=True)
    
    sequence_number: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    
    actor_type: Mapped[str] = mapped_column(String(50), nullable=False)
    actor_id: Mapped[str] = mapped_column(String(100), default='system')
    
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    target_type: Mapped[str] = mapped_column(String(50), nullable=False)
    target_id: Mapped[str] = mapped_column(String(100), nullable=False)
    
    summary: Mapped[str] = mapped_column(String(255), nullable=False)
    details: Mapped[dict] = mapped_column(JSON, default=dict)
    policy_passed: Mapped[bool] = mapped_column(Boolean, default=True)
    
    prev_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    current_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    
    @staticmethod
    def calculate_hash(
        sequence_number: int,
        timestamp_str: str,
        actor_type: str,
        actor_id: str,
        action: str,
        target_type: str,
        target_id: str,
        summary: str,
        details: dict,
        policy_passed: bool,
        prev_hash: str
    ) -> str:
        canonical_details = json.dumps(details, sort_keys=True, separators=(',', ':'))
        payload = f'{sequence_number}|{timestamp_str}|{actor_type}|{actor_id}|{action}|{target_type}|{target_id}|{summary}|{canonical_details}|{policy_passed}|{prev_hash}'
        return hashlib.sha256(payload.encode('utf-8')).hexdigest()
