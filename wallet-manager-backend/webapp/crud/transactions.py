from sqlalchemy import select, distinct, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from webapp.crud.utils.operations import AsyncCRUDFactory
from webapp.models.main_db.transactions import Transactions

transactions_crud = AsyncCRUDFactory(Transactions)

async def get_unique_from_w(session: AsyncSession):
    subquery = (
        select(Transactions)
        .filter(Transactions.status == 'created')
        .distinct(Transactions.from_w)
        .subquery()
    )
    alias = aliased(Transactions, subquery)
    result = await session.execute(select(alias))
    unique_transactions = result.scalars().all()
    return unique_transactions

async def update_transaction_status(session: AsyncSession, transactions_info, new_status: str):
    transaction_ids = [transaction.id for transaction in transactions_info]
    await session.execute(
        update(Transactions)
        .where(Transactions.id.in_(transaction_ids))
        .values(status=new_status)
    )
    await session.commit()

async def update_transaction_status_by_id(session: AsyncSession, trns_id: int, new_status: str):
    await session.execute(
        update(Transactions)
        .where(Transactions.id == trns_id)
        .values(status=new_status)
    )
    await session.commit()
