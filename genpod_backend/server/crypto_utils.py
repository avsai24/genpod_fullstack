import os
from cryptography.fernet import Fernet
from dotenv import load_dotenv

# Load .env variables
load_dotenv()

# Get the Fernet secret key from environment
FERNET_SECRET = os.getenv("FERNET_SECRET")

if not FERNET_SECRET:
    raise ValueError("FERNET_SECRET not found in environment variables")

# Initialize Fernet with the secret key
fernet = Fernet(FERNET_SECRET.encode())

def encrypt_token(token: str) -> str:
    """Encrypts the given token."""
    return fernet.encrypt(token.encode()).decode()

def decrypt_token(encrypted_token: str) -> str:
    """Decrypts the given token."""
    return fernet.decrypt(encrypted_token.encode()).decode()