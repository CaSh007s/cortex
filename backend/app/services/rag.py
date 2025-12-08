import os
import json
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

load_dotenv()

PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

class RagService:
    def __init__(self):
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/text-embedding-004", 
            google_api_key=GOOGLE_API_KEY
        )
        
        self.vectorstore = PineconeVectorStore(
            index_name=PINECONE_INDEX_NAME,
            embedding=self.embeddings
        )
        
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash", 
            temperature=0,
            google_api_key=GOOGLE_API_KEY
        )

    async def stream_chat(self, query: str, notebook_id: str):
        """
        Generator function that yields chunks of text, then sources at the end.
        """
        # 1. Retrieve Documents (FIXED: Using namespace)
        retriever = self.vectorstore.as_retriever(
            search_kwargs={
                "k": 3,
                "namespace": notebook_id # <--- This matches your Ingestion logic
            }
        )
        docs = retriever.invoke(query)
        
        # Format sources
        sources = [
            {
                "source": doc.metadata.get("source", "Unknown"), 
                "page": doc.metadata.get("page", 1)
            } 
            for doc in docs
        ]
        
        # 2. Setup Chain
        template = """You are Cortex, an intelligent AI assistant. 
        Answer the question based only on the following context. 
        If the answer is not in the context, say you don't know.

        Context:
        {context}

        Question: {question}
        """
        prompt = ChatPromptTemplate.from_template(template)
        
        def format_docs(docs):
            return "\n\n".join(doc.page_content for doc in docs)

        chain = (
            prompt 
            | self.llm 
            | StrOutputParser()
        )

        # 3. Stream Answer
        async for chunk in chain.astream({
            "context": format_docs(docs), 
            "question": query
        }):
            yield chunk

        # 4. Yield Sources
        yield f"\n__SOURCES__{json.dumps(sources)}"

    # Keep legacy method aligned just in case
    def chat(self, query: str, notebook_id: str):
        retriever = self.vectorstore.as_retriever(
            search_kwargs={"k": 3, "namespace": notebook_id}
        )
        docs = retriever.invoke(query)
        
        template = "Answer based on context:\n{context}\n\nQuestion: {question}"
        prompt = ChatPromptTemplate.from_template(template)
        chain = prompt | self.llm | StrOutputParser()
        
        context_str = "\n\n".join(doc.page_content for doc in docs)
        answer = chain.invoke({"context": context_str, "question": query})
        
        sources = [{"source": doc.metadata.get("source", "Unknown"), "page": doc.metadata.get("page", 1)} for doc in docs]
        return {"answer": answer, "sources": sources}