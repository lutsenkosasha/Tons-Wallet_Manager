from fastapi import Depends, HTTPException
from fastapi.responses import ORJSONResponse
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status

from webapp.api.crud.wallets.router import wallets_router
from webapp.crud.wallets import wallets_crud
from webapp.db.postgres import get_session
from webapp.schema.info.wallets import WalletInfo


@wallets_router.post('/create')
async def create_wallet(
    body: WalletInfo,
    session: AsyncSession = Depends(get_session),
) -> ORJSONResponse:
    try:
        await wallets_crud.create(session, body)
    except IntegrityError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT)

    return ORJSONResponse(content={'message': 'Wallet created successfully'}, status_code=status.HTTP_201_CREATED)
