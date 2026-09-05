from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.models.audit_event import AuditEvent
from backend.app.models.schemas import AuditChainVerification

GENESIS_HASH = '0' * 64

class AuditService:
    @staticmethod
    async def log_event(
        db: AsyncSession,
        merchant_id: str,
        actor_type: str,
        actor_id: str,
        action: str,
        target_type: str,
        target_id: str,
        summary: str,
        details: Dict[str, Any],
        policy_passed: bool = True
    ) -> AuditEvent:
        stmt = (
            select(AuditEvent)
            .where(AuditEvent.merchant_id == merchant_id)
            .order_by(AuditEvent.sequence_number.desc())
            .limit(1)
        )
        result = await db.execute(stmt)
        last_event = result.scalar_one_or_none()
        
        sequence_number = 1 if last_event is None else last_event.sequence_number + 1
        prev_hash = GENESIS_HASH if last_event is None else last_event.current_hash
        now = datetime.utcnow()
        timestamp_str = now.isoformat()
        
        current_hash = AuditEvent.calculate_hash(
            sequence_number=sequence_number,
            timestamp_str=timestamp_str,
            actor_type=actor_type,
            actor_id=actor_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            summary=summary,
            details=details,
            policy_passed=policy_passed,
            prev_hash=prev_hash
        )
        
        event = AuditEvent(
            merchant_id=merchant_id,
            sequence_number=sequence_number,
            timestamp=now,
            actor_type=actor_type,
            actor_id=actor_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            summary=summary,
            details=details,
            policy_passed=policy_passed,
            prev_hash=prev_hash,
            current_hash=current_hash
        )
        
        db.add(event)
        await db.commit()
        await db.refresh(event)
        return event

    @staticmethod
    async def verify_chain(db: AsyncSession, merchant_id: str) -> AuditChainVerification:
        stmt = (
            select(AuditEvent)
            .where(AuditEvent.merchant_id == merchant_id)
            .order_by(AuditEvent.sequence_number.asc())
        )
        result = await db.execute(stmt)
        events = result.scalars().all()
        
        if not events:
            return AuditChainVerification(
                is_valid=True,
                total_events=0,
                genesis_hash=None,
                latest_hash=None
            )
            
        prev_hash = GENESIS_HASH
        for idx, event in enumerate(events):
            expected_sequence = idx + 1
            if event.sequence_number != expected_sequence:
                return AuditChainVerification(
                    is_valid=False,
                    total_events=len(events),
                    tampered_event_id=event.id,
                    error_message=f'Sequence broken at event {event.id}: expected {expected_sequence}, got {event.sequence_number}'
                )
            
            if event.prev_hash != prev_hash:
                return AuditChainVerification(
                    is_valid=False,
                    total_events=len(events),
                    tampered_event_id=event.id,
                    error_message=f'Hash chain broken at event {event.id}: stored prev_hash does not match previous event hash'
                )
                
            recomputed = AuditEvent.calculate_hash(
                sequence_number=event.sequence_number,
                timestamp_str=event.timestamp.isoformat(),
                actor_type=event.actor_type,
                actor_id=event.actor_id,
                action=event.action,
                target_type=event.target_type,
                target_id=event.target_id,
                summary=event.summary,
                details=event.details,
                policy_passed=event.policy_passed,
                prev_hash=event.prev_hash
            )
            
            if recomputed != event.current_hash:
                return AuditChainVerification(
                    is_valid=False,
                    total_events=len(events),
                    tampered_event_id=event.id,
                    error_message=f'Payload tamper detected in event {event.id}: stored hash does not match computed hash'
                )
                
            prev_hash = event.current_hash
            
        return AuditChainVerification(
            is_valid=True,
            total_events=len(events),
            genesis_hash=events[0].current_hash,
            latest_hash=events[-1].current_hash
        )
