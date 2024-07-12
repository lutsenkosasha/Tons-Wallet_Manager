import asyncio
from typing import List

from pytoniq import LiteServerError, LiteClient
from pytoniq_core import Address
from pytoniq.contract.wallets.wallet import WalletV3R2, WalletV4R2
from tonsdk.utils import from_nano, to_nano

from webapp.crud.transactions import update_transaction_status_by_id
from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession
from webapp.integrations.logger import transactions_logger
from webapp.models.main_db.transactions import StatusEnum


async def send_transaction(mnemonic: str, to_addrs: List[Address], provider: LiteClient, amount: float | int, id: int, session_maker: async_sessionmaker[AsyncSession]):
    try:
        wallet = await WalletV4R2.from_mnemonic(provider, mnemonic)
        if wallet.balance == 0 and wallet.seqno == 0:
            wallet = await WalletV3R2.from_mnemonic(provider, mnemonic)

        await asyncio.sleep(0.06)

        transactions_logger.info(f'ID: {id}, from_w balance: {from_nano(wallet.balance, "ton")}')
        transactions_logger.info(f'ID: {id}, seqno: {wallet.seqno}')

        if float(from_nano(wallet.balance, 'ton')) - 0.1 < amount * len(to_addrs):
            transactions_logger.info(f"ID: {id}, Недостаточно средств на кошельке ... выход")
            async with session_maker() as session:
                await update_transaction_status_by_id(session, id, StatusEnum.need_money)
            return

        wallets_transactions = []
        for addr in to_addrs:
            w_t = wallet.create_wallet_internal_message(
                destination=addr,
                value=to_nano(amount, 'ton')
            )
            wallets_transactions.append(w_t)

        await wallet.raw_transfer(wallets_transactions)
        transactions_logger.info(f'ID: {id}, transaction sent now')
    except LiteServerError as e:
        transactions_logger.error(f"\nID: {id}, LiteServerError: {e}, перезапуск... \n")
        await asyncio.sleep(0.5)
        await provider.reconnect()
        async with session_maker() as session:
            await update_transaction_status_by_id(session, id, StatusEnum.error)
        await send_transaction(mnemonic, to_addrs, provider, amount, id, session_maker)
    except Exception as er:
        await asyncio.sleep(0.5)
        await provider.reconnect()
        transactions_logger.error(f"\nID: {id}, Ошибка: {er} \n")
        async with session_maker() as session:
            await update_transaction_status_by_id(session, id, StatusEnum.error)


async def verify_transaction(provider: LiteClient, from_addr: str, id: int, session_maker: async_sessionmaker[AsyncSession]):
    firstSeqno = await provider.run_get_method(address=from_addr, method='seqno', stack=[])
    currentSeqno = firstSeqno
    confirm_attempts = 0
    max_confirm_attempts = 60
    while currentSeqno == firstSeqno:
        try:
            transactions_logger.info(f"waiting for transaction {id} to confirm...{confirm_attempts}")
            await asyncio.sleep(1)
            currentSeqno = await provider.run_get_method(address=from_addr, method='seqno', stack=[])
            confirm_attempts += 1
            if confirm_attempts >= max_confirm_attempts:
                transactions_logger.info(f"Transaction {id} confirmation attempts exceeded {max_confirm_attempts}")
                async with session_maker() as session:
                    await update_transaction_status_by_id(session, id, StatusEnum.repeat)
                return False
        except LiteServerError as e:
            transactions_logger.error(f"LiteServerError: {e}, перезапуск...")
            await asyncio.sleep(0.5)  # Пауза перед перезапуском
            await provider.reconnect()

    transactions_logger.info("Владик молодец")
    async with session_maker() as session:
        await update_transaction_status_by_id(session, id, StatusEnum.success)
    return True