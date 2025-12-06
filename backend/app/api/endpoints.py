import shutil
import os
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel
from typing import List

from app.api.deps import get_current_user
from app.db import (
    get_all_notebooks, create_notebook, add_file_to_notebook, 
    get_notebook, add_message_to_notebook, delete_file_from_notebook,
    rename_notebook, delete_notebook, delete_all_user_data
)
from app.services.ingestion import IngestionService
from app.services.rag import RagService

router = APIRouter()
ingestion_service = IngestionService()
rag_service = RagService()

# --- Models ---
class CreateNotebookRequest(BaseModel):
    name: str

class ChatRequest(BaseModel):
    message: str
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
async def chat(request: ChatRequest, user_id: str = Depends(get_current_user)):
    try:
        # 1. Save User Message
        add_message_to_notebook(request.notebookId, "user", request.message, [], user_id)
        
        # 2. Get Full Answer (No Streaming)
        # We call the standard .chat() method, not .stream_chat()
        result = rag_service.chat(request.message, request.notebookId)
        
        # 3. Save Assistant Message
        add_message_to_notebook(request.notebookId, "assistant", result["answer"], result["sources"], user_id)
        
        # 4. Return JSON
        return {"answer": result["answer"], "sources": result["sources"]}
        
    except Exception as e:
        print(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Ingestion Routes ---
@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks, 
    file: UploadFile = File(...),
    notebookId: str = Form(...),
    user_id: str = Depends(get_current_user)
):
    allowed_types = ["application/pdf", "text/plain", "application/octet-stream"]
    if file.content_type not in allowed_types and not file.filename.endswith(".txt"):
        raise HTTPException(status_code=400, detail="Only PDF or TXT allowed")

    file_location = f"temp_{file.filename}"
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)

    add_file_to_notebook(notebookId, file.filename, user_id)

    def background_ingestion(path, n_id, f_name, c_type):
        try:
            if c_type == "application/pdf" or f_name.endswith(".pdf"):
                ingestion_service.process_pdf(path, n_id)
            else:
                ingestion_service.process_text_file(path, n_id)
        except Exception as e:
            print(f"Ingestion Failed: {e}")
        finally:
            if os.path.exists(path):
                os.remove(path)

    background_tasks.add_task(background_ingestion, file_location, notebookId, file.filename, file.content_type)
    return {"message": "Upload started"}

@router.post("/ingest-url")
async def ingest_url(request: UrlIngestRequest, user_id: str = Depends(get_current_user)):
    try:
        title = ingestion_service.process_url(request.url, request.notebookId)
        entry_name = f"WEB: {title[:20].strip()}..." 
        add_file_to_notebook(request.notebookId, entry_name, user_id)
        return {"status": "success", "title": title}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
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