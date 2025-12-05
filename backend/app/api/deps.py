import os
from dotenv import load_dotenv  # <--- 1. Import this
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client

# 2. Load environment variables before doing anything else
load_dotenv()

# Initialize Supabase Client
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")

# Safety check (Optional but good for debugging)
if not url or not key:
    print("❌ ERROR: SUPABASE_URL or SUPABASE_SERVICE_KEY is missing in backend/.env")

supabase: Client = create_client(url, key)

# The "Bearer" scheme expects a header like: Authorization: Bearer <token>
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Validates the JWT token sent by the frontend.
    Returns the user_id if valid.
    """
    token = credentials.credentials
    
    try:
        # Ask Supabase to verify the User
        user = supabase.auth.get_user(token)
        
        if not user or not user.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
            )
            
        # Return the specific User ID
        return user.user.id
        
    except Exception as e:
        print(f"Auth Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )