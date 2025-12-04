import shutil
import os
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List

from app.db import (
    get_all_notebooks, create_notebook, add_file_to_notebook, 
    get_notebook, add_message_to_notebook, delete_file_from_notebook,
    rename_notebook, delete_notebook
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

# --- Notebook Routes ---
# (Keep existing notebook routes: list, create, get, rename, delete)
@router.get("/notebooks")
def list_notebooks(): return get_all_notebooks()

@router.post("/notebooks")
def create_new_notebook(request: CreateNotebookRequest): return create_notebook(request.name)

@router.get("/notebooks/{notebook_id}")
def get_notebook_details(notebook_id: str): return get_notebook(notebook_id)

@router.put("/notebooks/{notebook_id}")
def update_notebook(notebook_id: str, request: CreateNotebookRequest): return rename_notebook(notebook_id, request.name)

@router.delete("/notebooks/{notebook_id}")
def remove_notebook(notebook_id: str):
    ingestion_service.delete_notebook_content(notebook_id)
    delete_notebook(notebook_id)
    return {"status": "success"}

@router.delete("/notebooks/{notebook_id}/files/{filename}")
def delete_file(notebook_id: str, filename: str):
    delete_file_from_notebook(notebook_id, filename)
    return {"status": "deleted"}

# --- Action Routes ---

@router.post("/chat")
async def chat(request: ChatRequest):
    try:
        add_message_to_notebook(request.notebookId, "user", request.message)
        result = rag_service.chat(request.message, request.notebookId)
        add_message_to_notebook(request.notebookId, "assistant", result["answer"], result["sources"])
        return {"answer": result["answer"], "sources": result["sources"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks, 
    file: UploadFile = File(...),
    notebookId: str = Form(...)
):
    # Allow PDF and Text/Markdown
    allowed_types = ["application/pdf", "text/plain", "application/octet-stream"]
    if file.content_type not in allowed_types and not file.filename.endswith(".txt"):
        raise HTTPException(status_code=400, detail="Only PDF or TXT allowed")

    file_location = f"temp_{file.filename}"
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)

    add_file_to_notebook(notebookId, file.filename)

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
async def ingest_url(request: UrlIngestRequest):
    try:
        # 1. Scrape and Vectorize
        title = ingestion_service.process_url(request.url, request.notebookId)
        
        # 2. Add to DB (Use title or URL as filename)
        entry_name = f"WEB: {title[:20].strip()}..." 
        add_file_to_notebook(request.notebookId, entry_name)
        
        return {"status": "success", "title": title}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))