import os
from dotenv import load_dotenv

load_dotenv()  # Loads variables from .env into environment

DB_PATH = os.getenv("DB_PATH")
print(DB_PATH)