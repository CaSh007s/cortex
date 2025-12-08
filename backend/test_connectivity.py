import os
from dotenv import load_dotenv
import google.generativeai as genai

# 1. Load your keys
load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("❌ CRITICAL: GOOGLE_API_KEY is missing from .env file!")
else:
    print(f"✅ Found API Key: {api_key[:5]}...*****")
    
    try:
        # 2. Configure the direct driver
        genai.configure(api_key=api_key)
        
        print("\n📡 Contacting Google to list available models...")
        models = genai.list_models()
        
        found_any = False
        for m in models:
            if 'generateContent' in m.supported_generation_methods:
                print(f"   - Available: {m.name}")
                found_any = True
        
        if not found_any:
            print("⚠️ Connection successful, but NO models returned. Check Google Cloud Console API enablement.")
            
    except Exception as e:
        print(f"\n❌ CONNECTION FAILED: {e}")