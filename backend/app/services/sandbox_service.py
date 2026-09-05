import uuid
from datetime import datetime
from typing import Dict, Any, Optional

class SandboxSimulatorService:
    @staticmethod
    def create_payment_link(
        customer_name: str,
        customer_email: str,
        customer_phone: Optional[str],
        amount_inr: float,
        description: str,
        expire_by_timestamp: int
    ) -> Dict[str, Any]:
        """
        Deterministic Local Sandbox Simulator.
        Generates realistic Razorpay Payment Link payload.
        Clearly labeled as LOCAL_SANDBOX_SIMULATOR.
        """
        link_id = f"plink_sandbox_{uuid.uuid4().hex[:14]}"
        short_url = f"https://rzp.io/i/sandbox_{link_id[14:]}"
        
        return {
            "id": link_id,
            "short_url": short_url,
            "status": "created",
            "amount": int(amount_inr * 100),
            "amount_paid": 0,
            "currency": "INR",
            "description": description,
            "customer": {
                "name": customer_name,
                "email": customer_email,
                "contact": customer_phone
            },
            "expire_by": expire_by_timestamp,
            "execution_mode": "sandbox_simulator",
            "created_at": int(datetime.utcnow().timestamp())
        }

    @staticmethod
    def generate_payment_webhook_payload(
        payment_link_id: str,
        amount_inr: float,
        status: str = "captured",
        payment_method: str = "upi",
        error_code: Optional[str] = None,
        error_description: Optional[str] = None
    ) -> Dict[str, Any]:
        payment_id = f"pay_sandbox_{uuid.uuid4().hex[:14]}"
        order_id = f"order_sandbox_{uuid.uuid4().hex[:14]}"
        
        event_name = "payment_link.paid" if status == "captured" else "payment.failed"
        
        return {
            "entity": "event",
            "account_id": "acc_sandbox_merchant",
            "event": event_name,
            "contains": ["payment", "payment_link"],
            "payload": {
                "payment_link": {
                    "entity": {
                        "id": payment_link_id,
                        "amount": int(amount_inr * 100),
                        "amount_paid": int(amount_inr * 100) if status == "captured" else 0,
                        "status": "paid" if status == "captured" else "failed"
                    }
                },
                "payment": {
                    "entity": {
                        "id": payment_id,
                        "order_id": order_id,
                        "amount": int(amount_inr * 100),
                        "currency": "INR",
                        "status": status,
                        "method": payment_method,
                        "fee": int(amount_inr * 100 * 0.02),
                        "tax": int(amount_inr * 100 * 0.02 * 0.18),
                        "error_code": error_code,
                        "error_description": error_description,
                        "created_at": int(datetime.utcnow().timestamp())
                    }
                }
            },
            "created_at": int(datetime.utcnow().timestamp())
        }
