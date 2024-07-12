from datetime import timedelta
from pydantic.v1 import BaseSettings
import json


class Settings(BaseSettings):
    BIND_IP: str
    BIND_PORT: int
    DB_URL: str
    JWT_SECRET_SALT: str
    FILE_EXPIRE_TIME: timedelta = timedelta(minutes=15)
    PAGE_LIMIT: int = 10
    SIMILARITY_THRESHOLD: int = 3

    # Здесь добавляем константу
    CONFIG_LITESERVER_1: dict
    CONFIG_LITESERVER_2: dict


# Загружаем JSON-конфиг
with open('conf/global1_60.config.json', 'r') as file:
    data_1 = json.load(file)

with open('conf/global1_60.config.json', 'r') as file:
    data_2 = json.load(file)

# Создаем объект настроек с учетом новой константы
settings = Settings(CONFIG_LITESERVER_1=data_1, CONFIG_LITESERVER_2=data_2)
