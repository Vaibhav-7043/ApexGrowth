from fastapi import APIRouter
from backend.app.api.health import router as health_router
from backend.app.api.auth import router as auth_router
from backend.app.api.onboarding import router as onboarding_router
from backend.app.api.merchants import router as merchants_router
from backend.app.api.customers import router as customers_router
from backend.app.api.analytics import router as analytics_router
from backend.app.api.audit import router as audit_router
from backend.app.api.seed import router as seed_router
from backend.app.api.opportunities import router as opportunities_router
from backend.app.api.agent import router as agent_router
from backend.app.api.approvals import router as approvals_router
from backend.app.api.policies import router as policies_router
from backend.app.api.campaigns import router as campaigns_router
from backend.app.api.sandbox import router as sandbox_router
from backend.app.api.webhooks import router as webhooks_router

api_router = APIRouter(prefix='/api')
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(onboarding_router)
api_router.include_router(merchants_router)
api_router.include_router(customers_router)
api_router.include_router(analytics_router)
api_router.include_router(audit_router)
api_router.include_router(seed_router)
api_router.include_router(opportunities_router)
api_router.include_router(agent_router)
api_router.include_router(approvals_router)
api_router.include_router(policies_router)
api_router.include_router(campaigns_router)
api_router.include_router(sandbox_router)
api_router.include_router(webhooks_router)
