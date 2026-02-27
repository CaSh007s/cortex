import os
from supabase import create_client, Client
from dotenv import load_dotenv
import uuid

load_dotenv()

# 1. Connect to Supabase
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")

if not url or not key:
    raise ValueError("Supabase credentials missing. Check .env file.")

supabase: Client = create_client(url, key)

# --- Gemini API Key Operations ---

def save_user_gemini_key(user_id: str, encrypted_key: str):
    try:
        response = supabase.table("user_keys").upsert({
            "user_id": user_id,
            "encrypted_gemini_key": encrypted_key
        }).execute()
        return True if response.data else False
    except Exception as e:
        print(f"Error saving to user_keys in Supabase: {e}")
        return False

def get_user_gemini_key(user_id: str):
    try:
        response = supabase.table("user_keys").select("encrypted_gemini_key").eq("user_id", user_id).execute()
        if response.data:
            return response.data[0]["encrypted_gemini_key"]
        return None
    except Exception as e:
        print(f"Error fetching user_keys from Supabase: {e}")
        return None

def remove_user_gemini_key(user_id: str):
    try:
        supabase.table("user_keys").delete().eq("user_id", user_id).execute()
        return True
    except Exception as e:
        print(f"Error deleting user_keys from Supabase: {e}")
        return False

# --- Notebook Operations ---

def get_all_notebooks(user_id: str):
    try:
        # Select all notebooks for the SPECIFIC user, ordered by newest
        response = supabase.table("notebooks") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .execute()
        
        notebooks = response.data or []
        
        # Manually fetch the file lists for the UI to show the count
        for nb in notebooks:
            files_response = supabase.table("files") \
                .select("name") \
                .eq("notebook_id", nb['id']) \
                .execute()
            nb['files'] = [f['name'] for f in (files_response.data or [])]
            
        return notebooks
    except Exception as e:
        print(f"Error fetching notebooks: {e}")
        return []

def create_notebook(name: str, user_id: str):
    response = supabase.table("notebooks").insert({
        "name": name,
        "user_id": user_id  # Use real user ID
    }).execute()
    
    # Supabase returns the created object
    new_notebook = response.data[0]
    new_notebook['files'] = [] 
    return new_notebook

def get_notebook(notebook_id: str, user_id: str):
    try:
        # Get Metadata - WITH SECURITY CHECK
        nb_response = supabase.table("notebooks") \
            .select("*") \
            .eq("id", notebook_id) \
            .eq("user_id", user_id) \
            .execute()
            
        if not nb_response.data:
            # If notebook doesn't exist OR doesn't belong to user, return None
            return None
            
        notebook = nb_response.data[0]
        
        # Get Files
        files_response = supabase.table("files") \
            .select("name") \
            .eq("notebook_id", notebook_id) \
            .execute()
        notebook['files'] = [f['name'] for f in (files_response.data or [])]
        
        # Get Messages
        msg_response = supabase.table("messages") \
            .select("*") \
            .eq("notebook_id", notebook_id) \
            .order("created_at", desc=False) \
            .execute()
        notebook['messages'] = msg_response.data or []
        
        return notebook
    except Exception as e:
        print(f"Error fetching notebook details: {e}")
        return None

def rename_notebook(notebook_id: str, new_name: str, user_id: str):
    response = supabase.table("notebooks") \
        .update({"name": new_name}) \
        .eq("id", notebook_id) \
        .eq("user_id", user_id) \
        .execute()
    return response.data[0] if response.data else None

def delete_notebook(notebook_id: str, user_id: str):
    # Only delete if user owns it
    supabase.table("notebooks") \
        .delete() \
        .eq("id", notebook_id) \
        .eq("user_id", user_id) \
        .execute()
    return True

# --- File Operations ---

def add_file_to_notebook(notebook_id: str, filename: str, user_id: str):
    # 1. SECURITY: Verify notebook belongs to user first
    check = supabase.table("notebooks").select("id").eq("id", notebook_id).eq("user_id", user_id).execute()
    if not check.data:
        raise Exception("Access Denied: Notebook does not belong to user")

    # 2. Check if file exists to avoid duplicates
    existing = supabase.table("files") \
        .select("*") \
        .eq("notebook_id", notebook_id) \
        .eq("name", filename) \
        .execute()
        
    if not existing.data:
        supabase.table("files").insert({
            "notebook_id": notebook_id,
            "name": filename
        }).execute()

def delete_file_from_notebook(notebook_id: str, filename: str, user_id: str):
    # 1. SECURITY: Verify notebook belongs to user
    check = supabase.table("notebooks").select("id").eq("id", notebook_id).eq("user_id", user_id).execute()
    if not check.data:
        raise Exception("Access Denied")

    # 2. Delete
    supabase.table("files") \
        .delete() \
        .eq("notebook_id", notebook_id) \
        .eq("name", filename) \
        .execute()

# --- Chat Operations ---

def add_message_to_notebook(notebook_id: str, role: str, content: str, sources: list = None, user_id: str = None):
    # 1. SECURITY: Verify notebook belongs to user (if user_id provided)
    if user_id:
        check = supabase.table("notebooks").select("id").eq("id", notebook_id).eq("user_id", user_id).execute()
        if not check.data:
            raise Exception("Access Denied")

    supabase.table("messages").insert({
        "notebook_id": notebook_id,
        "role": role,
        "content": content,
        "sources": sources or []
    }).execute()

# --- User Management ---

def delete_all_user_data(user_id: str):
    """
    Nuclear Option: Deletes all notebooks, files, and messages for a user.
    Because of Cascade Delete in SQL, deleting the 'notebooks' usually deletes
    the files and messages automatically, but we do it explicitly to be safe.
    """
    # 1. Delete all notebooks (Cascade should handle children like files/messages)
    supabase.table("notebooks").delete().eq("user_id", user_id).execute()
    return True