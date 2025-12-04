import os
from typing import List
import tempfile
from langchain_community.document_loaders import PyPDFLoader, WebBaseLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone, ServerlessSpec
from dotenv import load_dotenv

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