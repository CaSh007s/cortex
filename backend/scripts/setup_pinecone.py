import os
from dotenv import load_dotenv
from pinecone import Pinecone, ServerlessSpec

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

api_key = os.getenv("PINECONE_API_KEY")
index_name = os.getenv("PINECONE_INDEX_NAME", "rag-portfolio")

if not api_key:
    print("Error: PINECONE_API_KEY is not set.")
    exit(1)

pc = Pinecone(api_key=api_key)

print(f"Checking index: {index_name}")

try:
    existing_indexes = pc.list_indexes()
    index_names = [index.name for index in existing_indexes.indexes]
    print(f"Existing indexes: {index_names}")
    
    if index_name not in index_names:
        print(f"Index '{index_name}' not found. Attempting to create it...")
        pc.create_index(
            name=index_name,
            dimension=3072,
            metric="cosine",
            spec=ServerlessSpec(
                cloud="aws",
                region="us-east-1"
            )
        )
        print(f"Successfully created index '{index_name}'!")
    else:
        print(f"Index '{index_name}' already exists.")
        
except Exception as e:
    print(f"Error checking/creating index: {e}")
