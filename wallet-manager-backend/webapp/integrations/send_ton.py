import asyncio
from itertools import cycle

from pytoniq import LiteClient
from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession

from conf.config import settings
from pytoniq_core import Address

from webapp.crud.transactions import update_transaction_status_by_id
from webapp.integrations.logger import transactions_logger
from webapp.integrations.transfer_ton import send_transaction, verify_transaction
from webapp.models.main_db.transactions import StatusEnum

# async def send_ton(from_address: str, to_addresses: list[str], amount: float):
#     transactions_logger.info(f"Transferring {amount} from {from_address} to {to_addresses}\n")
#     await asyncio.sleep(5)  # Симуляция задержки
#     transactions_logger.info(f"Transfer completed from {from_address} to {to_addresses}\n")

server_cycle = cycle([
    LiteClient.from_config(settings.CONFIG_LITESERVER_1),
    LiteClient.from_config(settings.CONFIG_LITESERVER_2)
])


async def send_ton(from_addr: str, mnemonic: str, to_addresses: list[str], amount: float, id_trns: int, session_maker: async_sessionmaker[AsyncSession], attempt: int = 1):
    transactions_logger.info(f"Start transferring ID:{id_trns}, {amount} from {from_addr} to {to_addresses}, attempt {attempt}\n")
    DESTINATION_WALLETS = [Address(to_addr) for to_addr in to_addresses]

    tasks = []

    # Инициализируем и запускаем клиенты
    provider_from_60rps = LiteClient.from_config(settings.CONFIG_LITESERVER_1)
    # provider_from_mainnet = LiteClient.from_mainnet_config(2, 2)
    await provider_from_60rps.connect()
    # await provider_from_mainnet.connect()

    # Отправляем транзакции с проверкой результата
    tasks.append(asyncio.create_task(
        send_transaction(mnemonic, DESTINATION_WALLETS, provider_from_60rps, amount, id_trns, session_maker)))
    # tasks.append(asyncio.create_task(
    #     send_transaction(mnemonic, DESTINATION_WALLETS, provider_from_mainnet, amount, id_trns, session_maker)))
    await asyncio.gather(*tasks)

    # Проверяем результат транзакции и повторяем при необходимости
    success = await verify_transaction(provider_from_60rps, from_addr, id_trns, session_maker)

    if not success and attempt < 3:
        transactions_logger.info(f"Transaction ID: {id_trns} failed on attempt {attempt}, retrying...")
        await send_ton(from_addr, mnemonic, to_addresses, amount, id_trns, session_maker, attempt + 1)
    elif not success:
        transactions_logger.info(f"Transaction ID: {id_trns} failed after 3 attempts.")
        async with session_maker() as session:
            await update_transaction_status_by_id(session, id_trns, StatusEnum.error)
    else:
        transactions_logger.info(
            f"Successfully transferred {amount} from {from_addr} to {to_addresses} on attempt {attempt}")
