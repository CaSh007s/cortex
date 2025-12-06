import os
from typing import List
import tempfile
import io
from langchain_community.document_loaders import PyPDFLoader, WebBaseLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone, ServerlessSpec
from dotenv import load_dotenv
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

load_dotenv()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

class IngestionService:
    def __init__(self):
        self.pc = Pinecone(api_key=PINECONE_API_KEY)
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/text-embedding-004", 
            google_api_key=GOOGLE_API_KEY
        )

    def _get_splitter(self):
        return RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n\n", "\n", " ", ""]
        )

    def _index_documents(self, chunks: List, notebook_id: str):
        # Ensure Index
        existing_indexes = [index.name for index in self.pc.list_indexes()]
        if PINECONE_INDEX_NAME not in existing_indexes:
            self.pc.create_index(
                name=PINECONE_INDEX_NAME,
                dimension=768, 
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1")
            )
        
        print(f"Upserting {len(chunks)} chunks to namespace: {notebook_id}...")
        PineconeVectorStore.from_documents(
            documents=chunks,
            embedding=self.embeddings,
            index_name=PINECONE_INDEX_NAME,
            namespace=notebook_id
        )

    # PDF
    def process_pdf(self, file_path: str, notebook_id: str):
        print(f"--- Processing PDF: {file_path} ---")
        loader = PyPDFLoader(file_path)
        docs = loader.load()
        chunks = self._get_splitter().split_documents(docs)
        self._index_documents(chunks, notebook_id)

    # Text/Markdown
    def process_text_file(self, file_path: str, notebook_id: str):
        print(f"--- Processing Text File: {file_path} ---")
        loader = TextLoader(file_path)
        docs = loader.load()
        chunks = self._get_splitter().split_documents(docs)
        self._index_documents(chunks, notebook_id)

    # --- MODE 3: WEBSITE URL ---
    def process_url(self, url: str, notebook_id: str):
        print(f"--- Processing URL: {url} ---")
        
        # FIX: Add a User-Agent header so websites think we are a browser
        loader = WebBaseLoader(
            url,
            header_template={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
        )
        docs = loader.load()
        chunks = self._get_splitter().split_documents(docs)
        self._index_documents(chunks, notebook_id)
        
        # Return title, or fallback to URL if title is missing
        return docs[0].metadata.get('title', url)

    #MODE 4: GOOGLE DRIVE FILE ---
    def process_drive_file(self, file_id: str, access_token: str, notebook_id: str):
        """
        Download a file from Google Drive and ingest it.
        """
        try:
            # 1. Connect to Drive using the user's token
            creds = Credentials(token=access_token)
            service = build('drive', 'v3', credentials=creds)

            # 2. Get File Metadata (Name)
            file_metadata = service.files().get(fileId=file_id).execute()
            filename = file_metadata.get('name', 'drive_file.pdf')

            # 3. Download File Content
            request = service.files().get_media(fileId=file_id)
            file_stream = io.BytesIO()
            downloader = MediaIoBaseDownload(file_stream, request)
            
            done = False
            while done is False:
                status, done = downloader.next_chunk()

            # Reset stream pointer to beginning
            file_stream.seek(0)

            # 4. Save to Temp File (Standardizing for PyPDFLoader)
            # (We reuse the existing PDF loader logic by saving it temporarily)
            temp_filename = f"temp_drive_{filename}"
            with open(temp_filename, "wb") as f:
                f.write(file_stream.read())

            # 5. Process
            try:
                if filename.endswith(".pdf"):
                    self.process_pdf(temp_filename, notebook_id)
                else:
                    # Fallback for text/docs
                    self.process_text_file(temp_filename, notebook_id)
                
                return filename # Return name for DB
            finally:
                # Cleanup
                if os.path.exists(temp_filename):
                    os.remove(temp_filename)

        except Exception as e:
            print(f"Drive Ingestion Error: {e}")
            raise e

    # Delete Functionality
    def delete_notebook_content(self, notebook_id: str):
        """
        Wipes all vectors associated with a specific notebook namespace.
        """
        try:
            index = self.pc.Index(PINECONE_INDEX_NAME)
            index.delete(delete_all=True, namespace=notebook_id)
            print(f"Deleted all vectors for namespace: {notebook_id}")
        except Exception as e:
            print(f"Failed to delete namespace {notebook_id}: {e}")