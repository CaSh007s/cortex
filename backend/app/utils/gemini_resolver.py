import os
from fastapi import HTTPException
from app.db import get_user_gemini_key
from app.utils.encryption import decrypt_key

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")
SERVER_GEMINI_KEY = os.getenv("GOOGLE_API_KEY")

def resolve_gemini_key(user_id: str, user_email: str) -> str:
    """
    Resolves the Gemini API key to use for a particular request.
    1. If user is Admin, use server's GOOGLE_API_KEY
    2. Else, check DB for user's encrypted key and decrypt it
    3. If no key is found, raise a 428 Precondition Required exception
    """
    # 1. Admin bypass
    if user_email and ADMIN_EMAIL and user_email.lower() == ADMIN_EMAIL.lower():
        if not SERVER_GEMINI_KEY:
            raise HTTPException(status_code=500, detail="Server Gemini API key is missing.")
        return SERVER_GEMINI_KEY

    # 2. User provided key
    encrypted_key = get_user_gemini_key(user_id)
    if not encrypted_key:
        raise HTTPException(
            status_code=428, 
            detail="Bring Your Own Key required. Please provide your Gemini API key."
        )

    try:
        decrypted_key = decrypt_key(encrypted_key)
        return decrypted_key
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail="Failed to decrypt your API key."
        )
