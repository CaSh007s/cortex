import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("❌ Error: GOOGLE_API_KEY not found in .env")
    exit(1)

genai.configure(api_key=api_key)

print(f"Checking available models for key ending in ...{api_key[-4:]}...\n")

try:
    print("--- List of Available Models ---")
    found_flash = False
    for m in genai.list_models():
        if "generateContent" in m.supported_generation_methods:
            print(f"- {m.name}")
            if "flash" in m.name:
                found_flash = True
    print("--------------------------------")

    if found_flash:
        print("\n✅ SUCCESS: Flash model is available!")
    else:
        print("\n⚠️ WARNING: Flash model NOT found in your list.")
        
except Exception as e:
    print(f"\n❌ API Connection Failed: {e}")