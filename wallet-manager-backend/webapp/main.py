# webapp/main.py

import asyncio
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from webapp.api.crud.wallets.router import wallets_router
from webapp.api.v1.transactions.router import transactions_router
from webapp.db.postgres import get_session, async_session
from webapp.integrations.logger import init_logger
from webapp.integrations.task_manager import TaskManager

task_manager = TaskManager(max_tasks=5, session_maker=async_session)

def setup_middleware(app: FastAPI) -> None:
    # CORS Middleware should be the last.
    # See https://github.com/tiangolo/fastapi/issues/1663 .
    app.add_middleware(
        CORSMiddleware,
        allow_origins=['*'],
        allow_credentials=True,
        allow_methods=['*'],
        allow_headers=['*'],
    )

def setup_routers(app: FastAPI) -> None:
    routers = [
        wallets_router,
        transactions_router,
    ]
    for router in routers:
        app.include_router(router)

def create_app() -> FastAPI:
    app = FastAPI(docs_url='/swagger')
    setup_middleware(app)
    setup_routers(app)
    init_logger('API')
    init_logger('TRNS')

    @app.on_event("startup")
    async def startup_event():
        # Запускаем фоновую задачу
        task_manager.start_listener()
    return app
