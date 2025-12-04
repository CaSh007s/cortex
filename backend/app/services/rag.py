import os
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv

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
            model="gemini-2.0-flash", 
            temperature=0,
            google_api_key=GOOGLE_API_KEY
        )

    # UPDATED: Now accepts notebook_id
    def chat(self, query: str, notebook_id: str):
        # 1. Retriever with Namespace Filter
        # This tells Pinecone: "Only look at files in THIS notebook"
        retriever = self.vectorstore.as_retriever(
            search_kwargs={
                "k": 3,
                "namespace": notebook_id 
            }
        )

        # 2. Prompt
        template = (
            "You are a helpful assistant. Use the following context to answer the question. "
            "If you don't know the answer, say you don't know.\n\n"
            "Context:\n"
            "{context}\n\n"
            "Question: {input}"
        )
        prompt = ChatPromptTemplate.from_template(template)

        # 3. Chain
        question_answer_chain = create_stuff_documents_chain(self.llm, prompt)
        rag_chain = create_retrieval_chain(retriever, question_answer_chain)

        # 4. Invoke
        response = rag_chain.invoke({"input": query})
        
        return {
            "answer": response["answer"],
            "sources": [doc.metadata for doc in response["context"]]
        }