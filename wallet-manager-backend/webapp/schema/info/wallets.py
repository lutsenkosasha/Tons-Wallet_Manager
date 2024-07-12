from datetime import datetime
from typing import List, Any

from pydantic import BaseModel, ConfigDict


class WalletInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    name: str | Any
    mnemonic: str
    address: str
    created: datetime | Any


class WalletResponse(BaseModel):
    name: str
    mnemonic: str
    address: str
    created: datetime | Any


class WalletsListResponse(BaseModel):
    wallets: List[WalletResponse]
