import os
import base64
from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()

# The secret must be a url-safe base64-encoded 32-byte key.
_secret = os.environ.get("API_KEY_ENCRYPTION_SECRET")

# Initialize Fernet instance if secret exists
fernet_cipher = Fernet(_secret.encode()) if _secret else None

def encrypt_key(plain_key: str) -> str:
    """Encrypts a plaintext API key."""
    if not fernet_cipher:
        raise ValueError("API_KEY_ENCRYPTION_SECRET is not configured.")
    encrypted_bytes = fernet_cipher.encrypt(plain_key.encode())
    return encrypted_bytes.decode('utf-8')

def decrypt_key(encrypted_key: str) -> str:
    """Decrypts an encrypted API key back to plaintext."""
    if not fernet_cipher:
        raise ValueError("API_KEY_ENCRYPTION_SECRET is not configured.")
    decrypted_bytes = fernet_cipher.decrypt(encrypted_key.encode())
    return decrypted_bytes.decode('utf-8')
