from datetime import datetime
from enum import Enum
from sqlalchemy import DateTime, Integer, String, Enum as PgEnum
from sqlalchemy.orm import Mapped, mapped_column

from webapp.models.meta import DEFAULT_SCHEMA, Base


class StatusEnum(Enum):
    created = 'created'
    in_progress = 'in_progress'
    repeat = 'repeat'
    need_money = 'need_money'
    error = 'error'
    success = 'success'

class Transactions(Base):
    __tablename__ = 'transactions'
    __table_args__ = ({'schema': DEFAULT_SCHEMA},)

    id: Mapped[Integer] = mapped_column(Integer, primary_key=True, index=True)

    from_w: Mapped[str] = mapped_column(String, nullable=False)

    mnemonic: Mapped[str] = mapped_column(String, nullable=False)

    to_ws: Mapped[str] = mapped_column(String, nullable=False)

    amount: Mapped[str] = mapped_column(String, nullable=False)

    status: Mapped[StatusEnum] = mapped_column(PgEnum(StatusEnum, name="status", create_type=False), nullable=False)

    created: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
