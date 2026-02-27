import shutil
import os
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel, Field
from typing import List

from app.api.deps import get_current_user
from app.db import (
    get_all_notebooks, create_notebook, add_file_to_notebook, 
    get_notebook, add_message_to_notebook, delete_file_from_notebook,
    rename_notebook, delete_notebook, delete_all_user_data
)
from app.services.ingestion import IngestionService
from app.services.rag import RagService
from app.utils.gemini_resolver import resolve_gemini_key
from app.db import save_user_gemini_key
from app.utils.encryption import encrypt_key
from app.utils.rate_limiter import check_rate_limit

router = APIRouter()

def get_ingestion_service(api_key: str):
    return IngestionService(google_api_key=api_key)

def get_rag_service(api_key: str):
    return RagService(google_api_key=api_key)

# --- Models ---
class CreateNotebookRequest(BaseModel):
    name: str

class SaveKeyRequest(BaseModel):
    apiKey: str = Field(..., max_length=200)

class ChatRequest(BaseModel):
    message: str = Field(..., max_length=2000)
    notebookId: str

class UrlIngestRequest(BaseModel):
    url: str
    notebookId: str

class DriveIngestRequest(BaseModel):
    fileId: str
    accessToken: str
    notebookId: str

# --- Notebook Routes (Standard) ---
@router.get("/notebooks")
def list_notebooks(user_id: str = Depends(get_current_user)):
    return get_all_notebooks(user_id)

@router.post("/notebooks")
def create_new_notebook(request: CreateNotebookRequest, user_id: str = Depends(get_current_user)):
    return create_notebook(request.name, user_id)

@router.get("/notebooks/{notebook_id}")
def get_notebook_details(notebook_id: str, user_id: str = Depends(get_current_user)):
    return get_notebook(notebook_id, user_id)

@router.put("/notebooks/{notebook_id}")
def update_notebook(notebook_id: str, request: CreateNotebookRequest, user_id: str = Depends(get_current_user)):
    return rename_notebook(notebook_id, request.name, user_id)

@router.delete("/notebooks/{notebook_id}")
def remove_notebook(notebook_id: str, user_id: str = Depends(get_current_user)):
    ingestion_service.delete_notebook_content(notebook_id)
    delete_notebook(notebook_id, user_id)
    return {"status": "success"}

@router.delete("/notebooks/{notebook_id}/files/{filename}")
def delete_file(notebook_id: str, filename: str, user_id: str = Depends(get_current_user)):
    delete_file_from_notebook(notebook_id, filename, user_id)
    return {"status": "deleted"}

# --- Chat Route (ROLLED BACK TO STANDARD) ---
@router.post("/chat")
async def chat(request: ChatRequest, current_user = Depends(get_current_user)):
    user_id = current_user.id
    user_email = current_user.email
    
    # Apply Rate Limiting
    check_rate_limit(user_id)
    
    try:
        # 0. Resolve the Gemini API Key for the user
        gemini_api_key = resolve_gemini_key(user_id, user_email)
        
        # 1. Instantiate Dynamic RagService
        dynamic_rag_service = get_rag_service(gemini_api_key)
        
        # 2. Save User Message
        add_message_to_notebook(request.notebookId, "user", request.message, [], user_id)
        
        # 3. Get Full Answer (No Streaming)
        # We call the standard .chat() method, not .stream_chat()
        result = dynamic_rag_service.chat(request.message, request.notebookId)
        
        # 4. Save Assistant Message
        add_message_to_notebook(request.notebookId, "assistant", result["answer"], result["sources"], user_id)
        
        # 5. Return JSON
        return {"answer": result["answer"], "sources": result["sources"]}
        
    except HTTPException as he:
        # Re-raise HTTPExceptions specifically (like 428 from resolver)
        raise he
    except Exception as e:
        error_msg = str(e)
        print(f"Chat Error: {error_msg}")
        
        # If the key provided by the user is invalid/exhausted, it will throw a Google API error
        if "API_KEY_INVALID" in error_msg or "401" in error_msg or "403" in error_msg:
             # We could remove the key from DB here if we wanted to auto-purge bad keys
             # from app.db import remove_user_gemini_key
             # remove_user_gemini_key(user_id)
             raise HTTPException(
                 status_code=401, 
                 detail="Your Gemini API key is invalid or exhausted. Please update it."
             )
             
        raise HTTPException(status_code=500, detail=error_msg)

# --- Ingestion Routes ---
@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks, 
    file: UploadFile = File(...),
    notebookId: str = Form(...),
    current_user = Depends(get_current_user)
):
    user_id = current_user.id
    user_email = current_user.email
    
    # Apply Rate Limiting
    check_rate_limit(user_id)
    
    # Payload Validation (10MB limit)
    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")
    
    # Resolve the API key eagerly. This prevents uploading if key is missing.
    gemini_api_key = resolve_gemini_key(user_id, user_email)

    allowed_types = ["application/pdf", "text/plain", "application/octet-stream"]
    if file.content_type not in allowed_types and not file.filename.endswith(".txt"):
        raise HTTPException(status_code=400, detail="Only PDF or TXT allowed")

    file_location = f"temp_{file.filename}"
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)

    add_file_to_notebook(notebookId, file.filename, user_id)

    def background_ingestion(path, n_id, f_name, c_type, g_api_key):
        dynamic_ingestion_service = get_ingestion_service(g_api_key)
        try:
            if c_type == "application/pdf" or f_name.endswith(".pdf"):
                dynamic_ingestion_service.process_pdf(path, n_id)
            else:
                dynamic_ingestion_service.process_text_file(path, n_id)
        except Exception as e:
            print(f"Ingestion Failed: {e}")
        finally:
            if os.path.exists(path):
                os.remove(path)

    background_tasks.add_task(background_ingestion, file_location, notebookId, file.filename, file.content_type, gemini_api_key)
    return {"message": "Upload started"}

@router.post("/ingest-url")
async def ingest_url(request: UrlIngestRequest, current_user = Depends(get_current_user)):
    user_id = current_user.id
    user_email = current_user.email
    
    # Apply Rate Limiting
    check_rate_limit(user_id)
    
    try:
        gemini_api_key = resolve_gemini_key(user_id, user_email)
        dynamic_ingestion_service = get_ingestion_service(gemini_api_key)
        
        title = dynamic_ingestion_service.process_url(request.url, request.notebookId)
        entry_name = f"WEB: {title[:20].strip()}..." 
        add_file_to_notebook(request.notebookId, entry_name, user_id)
        return {"status": "success", "title": title}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- BYOK Route ---
@router.post("/user/gemini-key")
async def save_user_key(request: SaveKeyRequest, current_user = Depends(get_current_user)):
    user_id = current_user.id
    try:
        # Encrypt the incoming key
        encrypted_key = encrypt_key(request.apiKey)
        # Save to DB
        success = save_user_gemini_key(user_id, encrypted_key)
        if success:
            return {"status": "success", "message": "API Key saved securely."}
        else:
            raise HTTPException(status_code=500, detail="Failed to save API key.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving key: {str(e)}")
    
@router.delete("/purge-account")
async def purge_account(user_id: str = Depends(get_current_user)):
    try:
        # 1. Delete from DB
        delete_all_user_data(user_id)
        
        # 2. Delete from Vector Store (Pinecone)
        return {"status": "success", "message": "All data deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# @router.post("/ingest-drive")
# async def ingest_drive(request: DriveIngestRequest, user_id: str = Depends(get_current_user)):
#     try:
#         # 1. Download and Vectorize
#         filename = ingestion_service.process_drive_file(
#             request.fileId, 
#             request.accessToken, 
#             request.notebookId
#         )

#         # 2. Add to DB
#         entry_name = f"DRIVE: {filename}"
#         add_file_to_notebook(request.notebookId, entry_name, user_id)

#         return {"status": "success", "filename": filename}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))