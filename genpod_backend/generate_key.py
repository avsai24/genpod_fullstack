from cryptography.fernet import Fernet

# Generate a secure Fernet key
key = Fernet.generate_key()

# Print it out so we can use it in .env
print(key.decode())