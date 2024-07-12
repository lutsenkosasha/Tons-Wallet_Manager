from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from webapp.crud.utils.operations import AsyncCRUDFactory
from webapp.models.main_db.wallets import Wallets

wallets_crud = AsyncCRUDFactory(Wallets)


async def get_wallet_by_addr(session: AsyncSession, address: str) -> Wallets:
    result = await session.execute(select(Wallets).filter_by(address=address))
    wallet = result.scalars().first()
    return wallet.mnemonic