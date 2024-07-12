from datetime import datetime

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from webapp.models.meta import DEFAULT_SCHEMA, Base


class Wallets(Base):
    __tablename__ = 'wallets'
    __table_args__ = ({'schema': DEFAULT_SCHEMA},)

    id: Mapped[Integer] = mapped_column(Integer, primary_key=True, index=True)

    name: Mapped[str] = mapped_column(String, nullable=True)

    mnemonic: Mapped[str] = mapped_column(String, nullable=False)

    address: Mapped[str] = mapped_column(String, nullable=False)

    created: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
