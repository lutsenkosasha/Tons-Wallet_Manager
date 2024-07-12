from fastapi import APIRouter

from webapp.api.v1.const import API_PREFIX

transactions_router = APIRouter(prefix=f'{API_PREFIX}/transactions')
