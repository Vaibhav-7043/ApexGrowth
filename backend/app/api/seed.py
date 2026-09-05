from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.db.session import get_db
from backend.app.services.seed_service import SeedService

router = APIRouter(prefix='/seed', tags=['Seed Data'])

@router.post('/reset')
async def reset_and_seed_data(db: AsyncSession = Depends(get_db)):
    merchant = await SeedService.reset_and_seed(db)
    return {
        'status': 'success',
        'message': f'Database reset and seeded for merchant: {merchant.name}',
        'merchant_id': merchant.id
    }
