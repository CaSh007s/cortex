import os
import json
from typing import TypedDict, Annotated, List
from dotenv import load_dotenv

# LangChain / Google Imports
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, BaseMessage
from langchain_core.prompts import ChatPromptTemplate

# Agent Imports
from langchain_community.tools.tavily_search import TavilySearchResults
from langgraph.graph import StateGraph, END, add_messages
from langgraph.prebuilt import ToolNode

load_dotenv()

PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# 1. Define Agent State 
class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]

class RagService:
    def __init__(self, google_api_key: str):
        # Embeddings
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001", 
            google_api_key=google_api_key
        )
        
        # Vector Store
        self.vectorstore = PineconeVectorStore(
            index_name=PINECONE_INDEX_NAME,
            embedding=self.embeddings
        )
        
        # LLM (Back to YOUR chosen model)
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash", 
            temperature=0,
            google_api_key=google_api_key
        )

        # Tools
        self.search_tool = TavilySearchResults(max_results=3)

    def chat(self, message: str, notebook_id: str):
        # A. RETRIEVE PDF CONTEXT
        retriever = self.vectorstore.as_retriever(
            search_kwargs={"k": 3, "namespace": notebook_id}
        )
        docs = retriever.invoke(message)
        context_text = "\n\n".join([d.page_content for d in docs])
        
        if not context_text:
            context_text = "No PDF context found."

        # B. SETUP TOOLS
        tools = [self.search_tool]
        llm_with_tools = self.llm.bind_tools(tools)

        # C. SYSTEM PROMPT
        system_msg = f"""You are Cortex.
        
        STEP 1: Check PDF CONTEXT:
        {context_text}
        
        STEP 2: Answer.
        - If context has the answer, use it.
        - If NOT, use 'tavily_search_results_json' to search the web.
        
        Current Question: {message}
        """

        # D. BUILD GRAPH
        workflow = StateGraph(AgentState)

        def reasoner(state):
            # INVOKE LLM
            response = llm_with_tools.invoke(state['messages'])
            return {"messages": [response]}

        workflow.add_node("agent", reasoner)
        workflow.add_node("tools", ToolNode(tools))

        def should_continue(state):
            last_message = state['messages'][-1]
            if last_message.tool_calls:
                return "tools"
            return END

        workflow.set_entry_point("agent")
        workflow.add_conditional_edges("agent", should_continue)
        workflow.add_edge("tools", "agent")

        app = workflow.compile()

        # E. RUN
        inputs = {
            "messages": [
                SystemMessage(content=system_msg),
                HumanMessage(content=message)
            ]
        }
        
        result = app.invoke(inputs)

        # F. FORMAT OUTPUT
        last_message = result["messages"][-1]
        raw_content = last_message.content
        
        final_msg = ""
        
        # 🛡️ FIX: specific parsing for Gemini 2.5 Multi-part responses
        if isinstance(raw_content, str):
            final_msg = raw_content
        elif isinstance(raw_content, list):
            # If it's a list, extract the 'text' from each part
            parts = []
            for part in raw_content:
                if isinstance(part, dict) and "text" in part:
                    parts.append(part["text"])  # <--- This fixes your issue
                elif isinstance(part, str):
                    parts.append(part)
                else:
                    parts.append(str(part))
            final_msg = " ".join(parts)
        else:
            # Fallback for any other weird types
            final_msg = str(raw_content)

        # Handle case where Agent returns empty content but has tool calls
        if not final_msg.strip() and last_message.tool_calls:
             final_msg = "Searching the web..."

        sources = [
            {"source": doc.metadata.get("source", "Unknown"), "page": doc.metadata.get("page", 1)} 
            for doc in docs
        ]

        return {"answer": final_msg, "sources": sources}