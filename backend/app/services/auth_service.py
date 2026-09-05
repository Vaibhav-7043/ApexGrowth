import hashlib
import hmac
import secrets
import json
import base64
import time
from typing import Optional, Tuple, Dict, Any
from backend.app.config import settings

class SecurityService:
    @staticmethod
    def hash_password(password: str) -> Tuple[str, str]:
        """
        Secure password hashing using PBKDF2-HMAC-SHA256 with a unique 16-byte salt
        and 100,000 iterations.
        """
        salt = secrets.token_hex(16)
        pwd_hash = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            iterations=100_000
        ).hex()
        return pwd_hash, salt

    @staticmethod
    def verify_password(password: str, password_hash: str, salt: str) -> bool:
        """
        Constant-time verification of password against stored PBKDF2-HMAC-SHA256 hash.
        """
        computed = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            iterations=100_000
        ).hex()
        return hmac.compare_digest(computed, password_hash)

    @staticmethod
    def create_token(user_id: str, email: str, merchant_id: Optional[str] = None, expires_in_seconds: int = 86400 * 7) -> str:
        """
        Generates an HMAC-SHA256 signed session token.
        """
        payload = {
            'user_id': user_id,
            'email': email,
            'merchant_id': merchant_id,
            'exp': int(time.time()) + expires_in_seconds
        }
        raw_json = json.dumps(payload, separators=(',', ':')).encode('utf-8')
        b64_payload = base64.urlsafe_b64encode(raw_json).decode('utf-8').rstrip('=')
        sig = hmac.new(
            settings.JWT_SECRET.encode('utf-8'),
            b64_payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        return f"{b64_payload}.{sig}"

    @staticmethod
    def verify_token(token: str) -> Optional[Dict[str, Any]]:
        """
        Validates the token signature and expiration, returning the payload if valid.
        """
        try:
            parts = token.split('.')
            if len(parts) != 2:
                return None
            b64_payload, sig = parts
            expected_sig = hmac.new(
                settings.JWT_SECRET.encode('utf-8'),
                b64_payload.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            if not hmac.compare_digest(sig, expected_sig):
                return None
            padded = b64_payload + '=' * ((4 - len(b64_payload) % 4) % 4)
            raw_json = base64.urlsafe_b64decode(padded.encode('utf-8'))
            payload = json.loads(raw_json.decode('utf-8'))
            if payload.get('exp', 0) < time.time():
                return None
            return payload
        except Exception:
            return None
