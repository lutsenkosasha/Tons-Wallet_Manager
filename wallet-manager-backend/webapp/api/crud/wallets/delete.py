from fastapi import Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status

from webapp.api.crud.wallets.router import wallets_router
from webapp.crud.wallets import wallets_crud
from webapp.db.postgres import get_session
from webapp.models.main_db.wallets import Wallets


@wallets_router.post('/delete/{wallet_id}')
async def delete_wallet(
    wallet_id: int,
    session: AsyncSession = Depends(get_session),
) -> Response:
    if not await wallets_crud.delete(session, wallet_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
