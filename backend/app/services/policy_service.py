from datetime import datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.models.policy_config import PolicyConfig
from backend.app.models.customer import Customer

ALLOWED_ACTION_TYPES = {
    "razorpay_payment_link_incentive",
    "personalized_checkout_offer",
    "automated_winback_link"
}

class PolicyValidationResult:
    def __init__(self, passed: bool, violations: List[str], checks: Dict[str, bool], requires_manual_approval: bool):
        self.passed = passed
        self.violations = violations
        self.checks = checks
        self.requires_manual_approval = requires_manual_approval

    def to_dict(self) -> Dict[str, Any]:
        return {
            "passed": self.passed,
            "violations": self.violations,
            "checks": self.checks,
            "requires_manual_approval": self.requires_manual_approval,
            "validated_at": datetime.utcnow().isoformat()
        }

class PolicyService:
    @staticmethod
    async def get_or_create_policy(db: AsyncSession, merchant_id: str) -> PolicyConfig:
        stmt = select(PolicyConfig).where(PolicyConfig.merchant_id == merchant_id)
        result = await db.execute(stmt)
        policy = result.scalar_one_or_none()
        if not policy:
            policy = PolicyConfig(
                merchant_id=merchant_id,
                max_discount_percent=20.0,
                max_campaign_audience=500,
                max_budget_inr=50000.0,
                cooldown_days_per_customer=14,
                require_manual_approval_above_inr=5000.0
            )
            db.add(policy)
            await db.commit()
            await db.refresh(policy)
        return policy

    @staticmethod
    async def validate_strategy(
        db: AsyncSession,
        merchant_id: str,
        action_type: str,
        target_segment: str,
        target_customer_count: int,
        discount_percent: float,
        estimated_campaign_cost: float,
        validity_hours: int
    ) -> PolicyValidationResult:
        policy = await PolicyService.get_or_create_policy(db, merchant_id)
        violations: List[str] = []
        checks: Dict[str, bool] = {}
        
        # 1. Action Type Whitelist
        if action_type in ALLOWED_ACTION_TYPES:
            checks["allowed_action_type"] = True
        else:
            checks["allowed_action_type"] = False
            violations.append(f"Action type '{action_type}' is not permitted by policy.")
            
        # 2. Maximum Discount Percentage
        if discount_percent <= policy.max_discount_percent:
            checks["max_discount_limit"] = True
        else:
            checks["max_discount_limit"] = False
            violations.append(f"Discount {discount_percent}% exceeds policy maximum limit of {policy.max_discount_percent}%.")
            
        # 3. Maximum Audience Size
        if target_customer_count <= policy.max_campaign_audience:
            checks["max_audience_limit"] = True
        else:
            checks["max_audience_limit"] = False
            violations.append(f"Audience count {target_customer_count} exceeds policy maximum limit of {policy.max_campaign_audience}.")
            
        # 4. Maximum Financial Exposure / Budget Cap
        if estimated_campaign_cost <= policy.max_budget_inr:
            checks["max_budget_limit"] = True
        else:
            checks["max_budget_limit"] = False
            violations.append(f"Estimated cost INR {estimated_campaign_cost:,.2f} exceeds policy budget cap of INR {policy.max_budget_inr:,.2f}.")
            
        # 5. Validity Hours Bound
        if 1 <= validity_hours <= 168: # Max 7 days
            checks["validity_window"] = True
        else:
            checks["validity_window"] = False
            violations.append(f"Validity hours {validity_hours} must be between 1 and 168 hours.")
            
        # 6. Customer Fatigue / Cooldown Period Check
        now = datetime.utcnow()
        cooldown_threshold = now - timedelta(days=policy.cooldown_days_per_customer)
        cooldown_stmt = (
            select(func.count(Customer.id))
            .where(
                and_(
                    Customer.merchant_id == merchant_id,
                    Customer.rfm_segment == target_segment,
                    Customer.last_incentive_sent_at > cooldown_threshold
                )
            )
        )
        fatigued_count = int((await db.execute(cooldown_stmt)).scalar() or 0)
        if fatigued_count == 0:
            checks["customer_cooldown_passed"] = True
        else:
            checks["customer_cooldown_passed"] = False
            violations.append(f"{fatigued_count} customer(s) in segment '{target_segment}' received an offer within the {policy.cooldown_days_per_customer}-day cooldown period.")
            
        # 7. Manual Approval Requirement Threshold
        requires_manual_approval = estimated_campaign_cost >= policy.require_manual_approval_above_inr
        checks["manual_approval_gated"] = requires_manual_approval
        
        passed = len(violations) == 0
        return PolicyValidationResult(
            passed=passed,
            violations=violations,
            checks=checks,
            requires_manual_approval=requires_manual_approval
        )
