import asyncio
from fastapi import Depends, HTTPException
from fastapi.responses import ORJSONResponse
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status

from webapp.api.v1.transactions.router import transactions_router
from webapp.crud.transactions import transactions_crud
from webapp.crud.wallets import get_wallet_by_addr
from webapp.db.postgres import get_session
from webapp.integrations.logger import api_logger
from webapp.models.main_db.transactions import StatusEnum
from webapp.schema.info.transactions import TransactionInfo, TransactionCreate


@transactions_router.post('/transfer_ton')
async def transfer_ton(
    body: TransactionInfo,
    session: AsyncSession = Depends(get_session),
) -> ORJSONResponse:
    try:
        # Парсим все адреса из запроса откуда отправляем
        from_addresses = await parse_addresses(body.from_w)
        # Парсим адреса куда отправляем
        to_addresses = await parse_addresses(body.to_ws)

        # Перебираем каждый адрес отправителя
        for from_adr in from_addresses:
            to_adr_index = 0

            while to_adr_index < len(to_addresses):
                res_to_adrs = to_addresses[to_adr_index:to_adr_index + 4]
                to_adr_index += 4

                if res_to_adrs:
                    mnemonic = await get_wallet_by_addr(session, from_adr)
                    if mnemonic is None:
                        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Wallet not found")
                    transaction_data = TransactionCreate(
                        from_w = from_adr,
                        mnemonic = mnemonic,
                        to_ws=','.join(res_to_adrs),
                        amount=body.amount,
                        status=StatusEnum.created
                    )
                    transaction = await transactions_crud.create(session, transaction_data)
                    api_logger.info('Transaction record created with id: %d', transaction.id)

    except IntegrityError:
        api_logger.info('Transaction record not created')
        raise HTTPException(status_code=status.HTTP_409_CONFLICT)

    return ORJSONResponse(content={'message': 'Transaction created successfully'}, status_code=status.HTTP_201_CREATED)


async def parse_addresses(addresses_str: str) -> list:
    # Разделение строки по запятым и удаление лишних пробелов
    return [address.strip() for address in addresses_str.split(',') if address.strip()]
