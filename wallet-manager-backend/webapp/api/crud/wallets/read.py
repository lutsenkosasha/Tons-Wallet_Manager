from fastapi import Depends, HTTPException
from fastapi.responses import ORJSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status

from webapp.api.crud.wallets.router import wallets_router
from webapp.crud.wallets import wallets_crud
from webapp.db.postgres import get_session
from webapp.models.main_db.wallets import Wallets
from webapp.schema.info.wallets import WalletInfo, WalletResponse, WalletsListResponse


@wallets_router.get('/all', response_model=WalletsListResponse)
async def wallets_get(
    session: AsyncSession = Depends(get_session),
) -> ORJSONResponse:
    serialized_order = [
        WalletInfo.model_validate(wallet).model_dump() for wallet in await wallets_crud.get_all(session)
    ]
    return ORJSONResponse({'wallets': serialized_order}, status_code=status.HTTP_200_OK)


@wallets_router.get('/{wallet_id}', response_model=WalletResponse)
async def get_wallet(
    wallet_id: int,
    session: AsyncSession = Depends(get_session),
) -> ORJSONResponse:
    wallet = await wallets_crud.get_model(session, wallet_id)

    if wallet is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    serialized_wallet = WalletInfo(**wallet.__dict__).model_dump(mode='json')

    return ORJSONResponse({'wallet': serialized_wallet}, status_code=status.HTTP_200_OK)
