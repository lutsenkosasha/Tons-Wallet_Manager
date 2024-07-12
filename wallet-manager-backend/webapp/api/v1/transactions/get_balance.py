from fastapi import Depends, HTTPException
from fastapi.responses import ORJSONResponse
from pytoniq import LiteClient
from pytoniq_core import Address
from webapp.integrations.logger import api_logger
from starlette import status
from tonsdk.utils import from_nano

from conf.config import settings
from webapp.api.v1.transactions.router import transactions_router
from webapp.schema.info.transactions import BalanceResponse


@transactions_router.get('/balance/{wallet_addr}', response_model=BalanceResponse)
async def get_balance(
    wallet_addr: str,
) -> ORJSONResponse:
    try:
        provider_from_60rps = LiteClient.from_config(settings.CONFIG_LITESERVER_2)
        await provider_from_60rps.connect()
        addr_state = await provider_from_60rps.get_account_state(address=Address(wallet_addr))
    except Exception as e:
        api_logger.error(f"Error with get account state: {e}")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"{e}")


    serialized_balance = BalanceResponse(
        **{
            'balance' : str(from_nano(addr_state.balance, 'ton')),
            'status': addr_state.state.type_
        }
    ).model_dump(mode='json')

    return ORJSONResponse(serialized_balance, status_code=status.HTTP_200_OK)
