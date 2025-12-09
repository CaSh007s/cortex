import os
import sys
import pandas as pd
from dotenv import load_dotenv
from ragas.testset import TestsetGenerator
from ragas.llms import LangchainLLMWrapper
from ragas.embeddings import LangchainEmbeddingsWrapper
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.document_loaders import PyPDFLoader

# Setup
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
load_dotenv()

# 1. Config: Use "gemini-flash-latest" (Standard 1.5 Flash)
# This usually has the highest rate limit (15 RPM / 1500 RPD)
google_llm = ChatGoogleGenerativeAI(model="gemini-flash-latest", temperature=0)
google_embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")

generator_llm = LangchainLLMWrapper(google_llm)
generator_embeddings = LangchainEmbeddingsWrapper(google_embeddings)

async def generate():
    print("🧬 Reading PDF to generate synthetic test data...")
    
    pdf_path = "sample_data/my_document.pdf"
    if not os.path.exists(pdf_path):
        print(f"❌ Error: File not found at {pdf_path}")
        return

    loader = PyPDFLoader(pdf_path) 
    documents = loader.load()

    # 2. Initialize the Generator
    generator = TestsetGenerator(
        llm=generator_llm, 
        embedding_model=generator_embeddings
    )

    print("🧠 Generating questions using Gemini Flash Latest...")

    # 3. Generate the Exam
    try:
        # We generate ONLY 3 questions to be safe on quota
        testset = generator.generate_with_langchain_docs(
            documents,
            testset_size=3
        )
    except Exception as e:
        print(f"❌ Generation Failed: {e}")
        return

    # 4. Save to CSV
    df = testset.to_pandas()
    
    if df.empty:
        print("❌ Error: Generator produced 0 questions.")
        return

    print("\n📝 Preview of Generated Questions:")
    print(df[['question', 'ground_truth']].head())

    df.to_csv("synthetic_test_set.csv", index=False)
    print(f"\n✅ Successfully saved {len(df)} questions to 'synthetic_test_set.csv'")

if __name__ == "__main__":
    import asyncio
    asyncio.run(generate())