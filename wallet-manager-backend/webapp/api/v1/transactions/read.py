from fastapi import Depends
from fastapi.responses import ORJSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status

from webapp.api.v1.transactions.router import transactions_router
from webapp.crud.transactions import transactions_crud
from webapp.db.postgres import get_session
from webapp.schema.info.transactions import TransactionListResponse, TransactionResponse


@transactions_router.get('/all', response_model=TransactionListResponse)
async def transactions_get(
    session: AsyncSession = Depends(get_session),
) -> ORJSONResponse:
    serialized_transactions = [
        TransactionResponse.model_validate(transaction).model_dump() for transaction in await transactions_crud.get_all(session)
    ]
    return ORJSONResponse({'transactions': serialized_transactions}, status_code=status.HTTP_200_OK)
