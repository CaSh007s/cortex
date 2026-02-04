<div align="center">
  <h1>Cortex: AI-Powered Financial Intelligence</h1>
  
  <p>
    <strong>Analyze. Synthesize. Strategize.</strong>
    <br />
    A professional-grade RAG platform fueled by <strong>Gemini 2.5 Flash</strong> and <strong>LangGraph</strong>. 
    <br />
    Transforming static financial documents and portfolios into interactive, actionable insights.
  </p>

  <p>
    <a href="https://cortex-rag.vercel.app/">
      <img src="https://img.shields.io/badge/🚀_View_Live_Demo-cortex--rag.vercel.app-blue?style=for-the-badge&logo=vercel" alt="Live Demo" height="30">
    </a>
  </p>

  <p>
    <a href="https://github.com/CaSh007s/cortex/issues">
      <img src="https://img.shields.io/github/issues/CaSh007s/cortex?style=flat-square&logo=github&color=black" alt="Issues">
    </a>
    <a href="https://github.com/CaSh007s/cortex/network/members">
      <img src="https://img.shields.io/github/forks/CaSh007s/cortex?style=flat-square&logo=github&color=black" alt="Forks">
    </a>
    <a href="https://github.com/CaSh007s/cortex/stargazers">
      <img src="https://img.shields.io/github/stars/CaSh007s/cortex?style=flat-square&logo=github&color=black" alt="Stars">
    </a>
    <a href="https://github.com/CaSh007s/cortex/blob/master/LICENSE">
      <img src="https://img.shields.io/github/license/CaSh007s/cortex?style=flat-square&logo=github&color=black" alt="License">
    </a>
  </p>

  <br />
  <a href="https://cortex-rag.vercel.app/">
    <img src="screenshots/landing.png" alt="Cortex Landing Page" width="100%" style="border-radius: 10px; box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);">
  </a>
  <br />
</div>

<br />

<h2>⚡ Key Features</h2>
<ul>
  <li><strong>🤖 Agentic Reasoning Loop:</strong> Powered by <strong>LangGraph</strong>, allowing the AI to "think" through complex financial queries rather than just retrieving text.</li>
  <li><strong>🧠 Enterprise RAG Pipeline:</strong> Orchestrated by <strong>LangChain</strong> for precise document chunking, citation, and hallucination reduction.</li>
  <li><strong>🔍 Deep Semantic Search:</strong> Utilizes <strong>Supabase pgvector</strong> to find hidden connections in large PDF reports.</li>
  <li><strong>📊 Live Analytics Dashboard:</strong> A responsive React interface for real-time data visualization and chat.</li>
  <li><strong>🛡️ Secure Infrastructure:</strong> Full authentication via Supabase Auth and Row Level Security (RLS).</li>
</ul>

<br />

<h2>🛠️ Tech Stack</h2>
<div align="center">
  <table>
    <tr>
      <td align="center" width="90">
        <img src="https://skillicons.dev/icons?i=react" width="45" alt="React" /><br>React
      </td>
      <td align="center" width="90">
        <img src="https://skillicons.dev/icons?i=ts" width="45" alt="TypeScript" /><br>TypeScript
      </td>
      <td align="center" width="90">
        <img src="https://skillicons.dev/icons?i=tailwind" width="45" alt="Tailwind" /><br>Tailwind
      </td>
      <td align="center" width="90">
        <img src="https://skillicons.dev/icons?i=python" width="45" alt="Python" /><br>Python
      </td>
      <td align="center" width="90">
        <img src="https://skillicons.dev/icons?i=fastapi" width="45" alt="FastAPI" /><br>FastAPI
      </td>
      <td align="center" width="90">
        <img src="https://skillicons.dev/icons?i=supabase" width="45" alt="Supabase" /><br>Supabase
      </td>
      <td align="center" width="90">
        <img src="https://skillicons.dev/icons?i=gcp" width="45" alt="Gemini" /><br>Gemini
      </td>
      <td align="center" width="90">
        <img src="https://avatars.githubusercontent.com/u/126733545?s=200&v=4" width="45" alt="LangChain" /><br>LangChain
      </td>
      <td align="center" width="90">
        <img src="https://avatars.githubusercontent.com/u/126733545?s=200&v=4" width="45" alt="LangGraph" /><br>LangGraph
      </td>
    </tr>
  </table>
</div>

<br />

<h2>📸 Interface Preview</h2>

<h3>Intelligent Analytics Dashboard</h3>
<div align="center">
  <img src="screenshots/dashboard.png" width="100%" alt="Dashboard" style="border-radius: 10px; box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);">
</div>
<br />

<h3>Context-Aware AI Chat</h3>
<div align="center">
  <img src="screenshots/chat.png" width="100%" alt="Chat Interface" style="border-radius: 10px; box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);">
</div>
<br />

<h3>Data Ingestion & Controls</h3>
<div align="center">
  <table width="100%">
    <tr>
      <td align="center" width="50%">
        <img src="screenshots/upload.png" width="100%" alt="Document Upload" style="border-radius: 10px;">
        <br><br><strong>Drag & Drop Upload</strong>
      </td>
      <td align="center" width="50%">
        <img src="screenshots/settings.png" width="100%" alt="User Settings" style="border-radius: 10px;">
        <br><br><strong>User Preferences</strong>
      </td>
    </tr>
  </table>
</div>

<br />

<h2>🚀 Getting Started</h2>

<h3>1. Backend Setup</h3>
<pre>
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
</pre>

<h3>2. Frontend Setup</h3>
<pre>
cd ../frontend
npm install
</pre>

<h3>3. Environment Variables</h3>
<p>Create <code>.env</code> files in both <code>backend</code> and <code>frontend</code> directories following the <code>.env.example</code> templates.</p>

<h3>4. Run the Application</h3>
<pre>
# Terminal 1 (Backend)
cd backend && python -m uvicorn main:app --reload

# Terminal 2 (Frontend)

cd frontend && npm run dev

</pre>

<br />

<div align="center">
  <br />
  <hr />
  <p>
    Built with ❤️ by <a href="https://github.com/CaSh007s"><strong>Kalash Pratap Gaur</strong></a>
  </p>
  <p>
    <a href="https://github.com/CaSh007s">GitHub</a> • 
    <a href="https://github.com/CaSh007s/cortex">Repository</a>
  </p>
</div>
