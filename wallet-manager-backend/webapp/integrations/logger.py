""" Defines a function to initialize and configure loggers for the application. """
import logging


def init_logger(name: str) -> None:
    """
    Initializes and configures a logger with specified settings.

    Args:
    - name (str): Name of the logger.
    """
    logger = logging.getLogger(name)
    FORMAT = '%(asctime)s - %(name)s - %(levelname)s: %(message)s'
    logger.setLevel(logging.DEBUG)
    # Консоль
    sh = logging.StreamHandler()
    sh.setFormatter(logging.Formatter(FORMAT))
    sh.setLevel(logging.DEBUG)
    sh.setLevel(logging.DEBUG)
    logger.addHandler(sh)
    # Файл
    file = logging.FileHandler(f"{name}.log", mode='w')
    file.setFormatter(logging.Formatter(FORMAT))
    logger.addHandler(file)

    logger.debug('logger was initialized')


api_logger = logging.getLogger('API')
transactions_logger = logging.getLogger('TRNS')
