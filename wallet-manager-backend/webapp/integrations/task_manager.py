import asyncio
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from webapp.crud.transactions import get_unique_from_w, update_transaction_status, update_transaction_status_by_id
from webapp.integrations.logger import transactions_logger
from webapp.integrations.send_ton import send_ton
from webapp.models.main_db.transactions import StatusEnum
from webapp.schema.info.transactions import TransactionSerializer


class TaskManager:
    def __init__(self, max_tasks: int, session_maker: async_sessionmaker[AsyncSession]):
        self.semaphore = asyncio.Semaphore(max_tasks)
        self.active_from_adrs = {}
        self.session_maker = session_maker

    async def fetch_tasks_from_db(self):
        async with self.session_maker() as session:
            transactions_data = await get_unique_from_w(session)
            transactions_info = [
                TransactionSerializer.model_validate(transaction).model_dump() for transaction in transactions_data
            ]
            transactions_logger.info("Found new transactions: %s \n\n", transactions_info)
            for trans_info in transactions_info:
                if trans_info['from_w'] not in self.active_from_adrs:
                    await update_transaction_status(session, transactions_data, StatusEnum.in_progress)
            return transactions_info

    async def execute_task(self, task, from_addr: str = None):
        async with self.semaphore:
            await task
            # Удаляем задачу из активных после её завершения
            if from_addr:
                del self.active_from_adrs[from_addr]

    async def periodic_task(self):

        while True:
            transactions_info = await self.fetch_tasks_from_db()

            # Создание транзакции из всех найденных
            for transaction in transactions_info:
                # Адрес с какого кошелька отсылаем
                from_addr: str = transaction['from_w']
                to_addrs: List = transaction['to_ws'].split(",")
                amount: float = float(transaction['amount'])
                mnemonic: str = transaction['mnemonic']
                id: int = transaction['id']
                # Ограничение на выполнение транзакций с одинаковых адресов
                if from_addr not in self.active_from_adrs:
                    self.active_from_adrs[from_addr] = asyncio.create_task(self.execute_task(send_ton(from_addr, mnemonic, to_addrs, amount, id, self.session_maker), from_addr))
                else:
                    async with self.session_maker() as session:
                        await update_transaction_status_by_id(session, id, StatusEnum.created)

            await asyncio.sleep(10)  # Ждем 10 секунд

    def start_listener(self):
        asyncio.create_task(self.periodic_task())
