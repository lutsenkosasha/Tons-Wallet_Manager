from datetime import datetime
from typing import Any, List

from pydantic import BaseModel, ConfigDict

from webapp.models.main_db.transactions import StatusEnum


class TransactionInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    from_w: str | Any
    to_ws: str | Any
    amount: str

class TransactionCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    from_w: str
    to_ws: str
    amount: str
    mnemonic: str
    status: StatusEnum

class TransactionSerializer(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    from_w: str
    to_ws: str
    amount: str
    mnemonic: str
    status: StatusEnum

class TransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    from_w: str
    to_ws: str
    amount: str
    status: StatusEnum
    created: datetime | Any


class TransactionListResponse(BaseModel):
    transactions: List[TransactionResponse]

class BalanceResponse(BaseModel):
    balance: str
    status: str
