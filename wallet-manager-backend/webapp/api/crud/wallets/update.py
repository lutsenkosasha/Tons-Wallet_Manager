from fastapi import Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status

from webapp.api.crud.wallets.router import wallets_router
from webapp.crud.wallets import wallets_crud
from webapp.db.postgres import get_session
from webapp.models.main_db.wallets import Wallets
from webapp.schema.info.wallets import WalletInfo


@wallets_router.post('/update/{wallet_id}')
async def update_wallet(
    body: WalletInfo,
    wallet_id: int,
    session: AsyncSession = Depends(get_session),
) -> Response:
    existing_wallet = await wallets_crud.get_model(session, wallet_id)

    if existing_wallet is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    updated_wallet = await wallets_crud.update(session, wallet_id, body)

    if updated_wallet:
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    return Response(content={'message': 'Wallet created successfully'}, status_code=status.HTTP_201_CREATED)
