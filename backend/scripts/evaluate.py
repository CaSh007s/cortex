import os
import sys
import pandas as pd
import asyncio
import time  # <--- Added for safety delay
from dotenv import load_dotenv
from ragas import evaluate
from ragas.metrics import Faithfulness, AnswerRelevancy, ContextPrecision
from ragas.llms import LangchainLLMWrapper
from ragas.embeddings import LangchainEmbeddingsWrapper
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from datasets import Dataset
from supabase import create_client

# 1. Setup Environment
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
load_dotenv()

# 2. Config: Use "Lite" Model (High Quota)
# Switching to 2.0-flash-lite to avoid the 429 errors
google_llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash-lite", temperature=0)
google_embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")

judge_llm = LangchainLLMWrapper(google_llm)
judge_embeddings = LangchainEmbeddingsWrapper(google_embeddings)

# --- HELPER: Fetch ID from DB ---
def get_latest_notebook_id():
    try:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_KEY")
        if not url or not key:
            print("❌ Error: Missing Supabase keys in .env")
            return None
        supabase = create_client(url, key)
        response = supabase.table("notebooks").select("id, name, created_at").order("created_at", desc=True).limit(1).execute()
        if response.data:
            print(f"🔎 Auto-Detected Notebook: '{response.data[0]['name']}'")
            return response.data[0]['id']
        return None
    except Exception as e:
        print(f"❌ DB Connection Failed: {e}")
        return None
# --------------------------------

async def run_evaluation():
    print("🧪 Starting RAG Evaluation (Lite Mode)...")
    
    TEST_NOTEBOOK_ID = get_latest_notebook_id()
    if not TEST_NOTEBOOK_ID:
        return

    csv_path = "synthetic_test_set.csv"
    if not os.path.exists(csv_path):
        print("❌ Error: 'synthetic_test_set.csv' not found.")
        return

    print(f"📂 Loading questions from {csv_path}...")
    df = pd.read_csv(csv_path)

    # Import Service
    from app.services.rag import RagService
    rag = RagService()
    # FORCE the service to use the Lite model too, just for this test
    rag.llm = google_llm 
    
    data_samples = {
        "question": df["question"].tolist(),
        "ground_truth": df["ground_truth"].tolist(),
        "answer": [],
        "contexts": []
    }

    print(f"🚀 Running tests against Notebook ID: {TEST_NOTEBOOK_ID}")
    
    for q in data_samples["question"]:
        print(f"   Asking Cortex: '{q}'...")
        try:
            # 1. Get Response
            response = rag.chat(q, notebook_id=TEST_NOTEBOOK_ID)
            
            # 2. Extract Answer
            ans = response["answer"]
            
            # 3. Extract Contexts
            ctx_list = []
            for s in response["sources"]:
                content = s.get("page_content") or s.get("content") or str(s)
                ctx_list.append(content)
            
            data_samples["answer"].append(ans)
            data_samples["contexts"].append(ctx_list)
            
            # 4. SAFETY PAUSE (Avoids 429)
            time.sleep(2) 

        except Exception as e:
            print(f"   ❌ Error: {e}")
            if len(data_samples["answer"]) < len(data_samples["question"]):
                 data_samples["answer"].append("Error")
            if len(data_samples["contexts"]) < len(data_samples["question"]):
                 data_samples["contexts"].append(["Error"])

    # 5. Grading
    print("\n👨‍⚖️  The AI Judge is grading the answers...")
    dataset = Dataset.from_dict(data_samples)
    
    results = evaluate(
        dataset=dataset,
        metrics=[Faithfulness(), AnswerRelevancy(), ContextPrecision()],
        llm=judge_llm,
        embeddings=judge_embeddings
    )

    print("\n📊 === EVALUATION REPORT CARD ===")
    print(results)
    results.to_pandas().to_csv("rag_report_card.csv")
    print("✅ Report saved to 'rag_report_card.csv'")

if __name__ == "__main__":
    asyncio.run(run_evaluation())