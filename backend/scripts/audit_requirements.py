import importlib.metadata
import sys

# The list of critical packages we are using
packages = [
    "langchain",
    "langchain-core",
    "langchain-community",
    "langchain-google-genai",
    "langgraph",
    "tavily-python",
    "google-generativeai",
    "pinecone-client"
]

print("🔍 --- DEPENDENCY AUDIT ---")
print(f"{'PACKAGE':<30} {'INSTALLED VERSION':<20}")
print("-" * 50)

for pkg in packages:
    try:
        version = importlib.metadata.version(pkg)
        print(f"{pkg:<30} {version:<20}")
    except importlib.metadata.PackageNotFoundError:
        print(f"{pkg:<30} {'❌ NOT INSTALLED'}")

print("-" * 50)
print("\n📋 ANALYSIS:")

try:
    core_ver = importlib.metadata.version("langchain-core")
    google_ver = importlib.metadata.version("langchain-google-genai")
    
    print(f"• You have langchain-core: {core_ver}")
    print(f"• You have langchain-google-genai: {google_ver}")
    
    # Simple logic to detect the conflict from your logs
    if core_ver.startswith("1."): 
        print("\n⚠️  CRITICAL CONFLICT DETECTED ⚠️")
        print("   Your 'langchain-core' is version 1.x.x.")
        print("   But 'langchain-google-genai' requires version 0.3.x.")
        print("   This usually happens if you installed an old version of 'langchain' alongside new tools.")
    else:
        print("\n✅ Versions seem closer to the 0.3.x standard. If pip failed, run the harmonizer command below.")

except:
    pass