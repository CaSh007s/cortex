import os
from supabase import create_client, Client
from dotenv import load_dotenv
import uuid

load_dotenv()

# 1. Connect to Supabase
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

# --- HARDCODED TEST USER (To simulate a logged-in user) ---
# In Phase 5 (Auth), we will replace this with the real user's ID
TEST_USER_ID = "00000000-0000-0000-0000-000000000000" 

# --- Notebook Operations ---

def get_all_notebooks():
    # Select all notebooks for our test user, ordered by newest
    response = supabase.table("notebooks") \
        .select("*") \
        .eq("user_id", TEST_USER_ID) \
        .order("created_at", desc=True) \
        .execute()
    
    notebooks = response.data
    
    # We need to manually fetch the file lists for the UI to show the count
    # (In a production app, we'd use a SQL join, but this is simpler for now)
    for nb in notebooks:
        files_response = supabase.table("files") \
            .select("name") \
            .eq("notebook_id", nb['id']) \
            .execute()
        nb['files'] = [f['name'] for f in files_response.data]
        
    return notebooks

def create_notebook(name: str):
    response = supabase.table("notebooks").insert({
        "name": name,
        "user_id": TEST_USER_ID
    }).execute()
    
    # Supabase returns the created object
    new_notebook = response.data[0]
    new_notebook['files'] = [] # Initialize empty list for frontend compatibility
    return new_notebook

def get_notebook(notebook_id: str):
    # Get Metadata
    nb_response = supabase.table("notebooks") \
        .select("*") \
        .eq("id", notebook_id) \
        .execute()
        
    if not nb_response.data:
        return None
        
    notebook = nb_response.data[0]
    
    # Get Files
    files_response = supabase.table("files") \
        .select("name") \
        .eq("notebook_id", notebook_id) \
        .execute()
    notebook['files'] = [f['name'] for f in files_response.data]
    
    # Get Messages
    msg_response = supabase.table("messages") \
        .select("*") \
        .eq("notebook_id", notebook_id) \
        .order("created_at", desc=False) \
        .execute()
    notebook['messages'] = msg_response.data
    
    return notebook

def rename_notebook(notebook_id: str, new_name: str):
    response = supabase.table("notebooks") \
        .update({"name": new_name}) \
        .eq("id", notebook_id) \
        .execute()
    return response.data[0] if response.data else None

def delete_notebook(notebook_id: str):
    # Cascade delete in SQL handles files/messages, we just delete the notebook
    supabase.table("notebooks").delete().eq("id", notebook_id).execute()
    return True

# --- File Operations ---

def add_file_to_notebook(notebook_id: str, filename: str):
    # Check if exists first to avoid duplicates
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

def delete_file_from_notebook(notebook_id: str, filename: str):
    supabase.table("files") \
        .delete() \
        .eq("notebook_id", notebook_id) \
        .eq("name", filename) \
        .execute()

# --- Chat Operations ---

def add_message_to_notebook(notebook_id: str, role: str, content: str, sources: list = None):
    supabase.table("messages").insert({
        "notebook_id": notebook_id,
        "role": role,
        "content": content,
        "sources": sources or []
    }).execute()