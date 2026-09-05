import hmac
import hashlib
import httpx
from datetime import datetime
from typing import Dict, Any, Optional
from backend.app.config import settings
from backend.app.services.sandbox_service import SandboxSimulatorService

class RazorpayService:
    @staticmethod
    def get_mode() -> str:
        if settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET:
            return 'razorpay_test'
        return 'sandbox_simulator'

    @staticmethod
    async def create_payment_link(
        customer_name: str,
        customer_email: str,
        customer_phone: Optional[str],
        amount_inr: float,
        description: str,
        expire_by_timestamp: int
    ) -> Dict[str, Any]:
        # If Razorpay test credentials are configured, make real Test-Mode API call
        if settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET:
            url = 'https://api.razorpay.com/v1/payment_links'
            payload = {
                'amount': int(amount_inr * 100),
                'currency': 'INR',
                'accept_partial': False,
                'description': description,
                'customer': {
                    'name': customer_name,
                    'email': customer_email,
                    'contact': customer_phone
                },
                'notify': {'sms': False, 'email': True},
                'reminder_enable': True,
                'expire_by': expire_by_timestamp
            }
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(
                        url,
                        json=payload,
                        auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
                    )
                    if resp.status_code in [200, 201]:
                        res_data = resp.json()
                        res_data['execution_mode'] = 'razorpay_test'
                        return res_data
            except Exception:
                # Upstream network failure -> fallback safely to sandbox simulator
                pass
                
        # Default local sandbox simulator
        return SandboxSimulatorService.create_payment_link(
            customer_name=customer_name,
            customer_email=customer_email,
            customer_phone=customer_phone,
            amount_inr=amount_inr,
            description=description,
            expire_by_timestamp=expire_by_timestamp
        )

    @staticmethod
    def verify_webhook_signature(payload_body: str, signature: str, secret: str) -> bool:
        if not secret:
            return True
        computed_signature = hmac.new(
            secret.encode('utf-8'),
            payload_body.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(computed_signature, signature)
