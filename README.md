<div align="center">
  <h1 style="margin-bottom: 10px;">Cortex: Your AI-Powered Research Assistant</h1>

  <p style="font-size: 20px; margin-bottom: 10px;">
    <strong>Analyze. Synthesize. Strategize.</strong>
  </p>

  <br />

  <p style="max-width: 800px; line-height: 1.6; font-size: 17px;">
    A powerful <strong>RAG (Retrieval-Augmented Generation)</strong> platform 
    fueled by <strong>Gemini 2.5 Flash</strong> and <strong>LangGraph</strong>.
    <br /><br />
    Transforming static documents, PDFs, and web links into interactive, actionable research notebooks.
  </p>

  <br />

  <p>
    <a href="https://cortex-rag.vercel.app/">
      <img src="https://img.shields.io/badge/🚀_View_Live_Demo-cortex--rag.vercel.app-blue?style=for-the-badge&logo=vercel" alt="Live Demo" height="30">
    </a>
    <a href="https://youtu.be/izjxl_rqlv8">
      <img src="https://img.shields.io/badge/📺_Watch_YouTube_Demo-Video_Link_Here-red?style=for-the-badge&logo=youtube" alt="YouTube Demo" height="30">
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

  <table width="100%">
    <tr>
      <td align="center" width="70%">
        <img src="screenshots/landing.png" alt="Desktop Landing Page" style="border-radius: 10px; border: 1px solid #444;" height="400">
      </td>
      <td align="center" width="30%">
        <img src="screenshots/landing-mobile.png" alt="Mobile Landing Page" style="border-radius: 10px; border: 1px solid #444;" height="400">
      </td>
    </tr>
  </table>
</div>

<br />

<h2>⚡ Key Features</h2>
<ul>
  <li><strong>🤖 Agentic Reasoning Loop:</strong> Powered by <strong>LangGraph</strong>, allowing the AI to "think" through complex queries rather than just retrieving text.</li>
  <li><strong>🧠 Enterprise RAG Pipeline:</strong> Orchestrated by <strong>LangChain</strong> for precise document chunking, citation, and hallucination reduction.</li>
  <li><strong>🔑 Bring Your Own Key (BYOK):</strong> A secure, user-centric architecture that requires users to provide their own Gemini API key (AES-encrypted in the database) to use the app, ensuring zero LLM costs for the host.</li>
  <li><strong>🛡️ Production-Ready Guardrails:</strong> Hardened with <strong>Upstash Redis</strong> rate-limiting (req/min & req/day) and Supabase row-level security quotas (max notebooks/files) to protect the backend from abuse.</li>
  <li><strong>🔍 Deep Semantic Search:</strong> Utilizes <strong>Supabase pgvector</strong> to find hidden connections across massive PDF uploads and web pages.</li>
  <li><strong>📊 Live Analytics Dashboard:</strong> A highly responsive, <strong>collapsible React interface</strong> featuring real-time state synchronization via custom dispatch events. Fully optimized for both Desktop and Mobile.</li>
</ul>

<br />

<h2>📸 Interface Preview</h2>

<h3>Intelligent Analytics Dashboard (Responsive)</h3>
<div align="center">
  <table width="100%">
    <tr>
      <td align="center" width="70%">
        <img src="screenshots/dashboard.png" alt="Desktop Dashboard" style="border-radius: 10px; border: 1px solid #444;" height="350">
        <br><br><strong>Desktop View (Collapsible Sidebar)</strong>
      </td>
      <td align="center" width="30%">
        <img src="screenshots/dashboard-mobile.png" alt="Mobile Dashboard" style="border-radius: 10px; border: 1px solid #444;" height="350">
        <br><br><strong>Mobile View</strong>
      </td>
    </tr>
  </table>
</div>

<br />

<h3>Context-Aware AI Chat</h3>
<div align="center">
  <table width="100%">
    <tr>
      <td align="center" width="70%">
        <img src="screenshots/chat.png" alt="Desktop Chat" style="border-radius: 10px; border: 1px solid #444;" height="350">
        <br><br><strong>Immersive Reading Mode</strong>
      </td>
      <td align="center" width="30%">
        <img src="screenshots/chat-mobile.png" alt="Mobile Chat" style="border-radius: 10px; border: 1px solid #444;" height="350">
        <br><br><strong>Mobile Chat Interface</strong>
      </td>
    </tr>
  </table>
</div>

<br />

<h3>Data Ingestion & Controls</h3>
<div align="center">
  <table width="100%">
    <tr>
      <td align="center" width="70%">
        <img src="screenshots/upload.png" alt="Document Upload" style="border-radius: 10px; border: 1px solid #444;" height="300">
        <br><br><strong>Context Upload</strong>
      </td>
      <td align="center" width="30%">
        <img src="screenshots/upload-mobile.png" alt="Upload Mobile" style="border-radius: 10px; border: 1px solid #444;" height="300">
        <br><br><strong>Mobile View</strong>
      </td>
    </tr>
    <tr>
      <td align="center" width="70%">
        <img src="screenshots/settings.png" alt="User Settings" style="border-radius: 10px; border: 1px solid #444;" height="300">
        <br><br><strong>User Preferences</strong>
      </td>
      <td align="center" width="30%">
        <img src="screenshots/settings-mobile.png" alt="Settings Mobile" style="border-radius: 10px; border: 1px solid #444;" height="300">
        <br><br><strong>Mobile Config</strong>
      </td>
    </tr>
  </table>
</div>

<br />

<h2>🚀 Getting Started</h2>

<h3>1. Backend Setup</h3>
<pre><code>cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
</code></pre>

<h3>2. Frontend Setup</h3>
<pre><code>cd ../frontend
npm install
</code></pre>

<h3>3. Environment Variables</h3>
<p>Create <code>.env</code> files in both <code>backend</code> and <code>frontend</code> directories following the <code>.env.example</code> templates.</p>

<h3>4. Run the Application</h3>

<div style="background-color:#0d1117; padding:20px; border-radius:10px; border:1px solid #30363d;">

  <p style="margin:0 0 10px 0;"><strong>Terminal 1 — Backend</strong></p>
  <pre style="margin:0 0 20px 0;"><code>cd backend
python -m uvicorn main:app --reload</code></pre>

  <hr style="border:0; border-top:1px solid #30363d; margin:20px 0;" />

  <p style="margin:0 0 10px 0;"><strong>Terminal 2 — Frontend</strong></p>
  <pre style="margin:0;"><code>cd frontend
npm run dev</code></pre>

</div>

<br />

<div align="center">
  <hr />
  <p>
    Built with ❤️ by <a href="https://github.com/CaSh007s"><strong>Kalash Pratap Gaur</strong></a>
  </p>
  <p>
    <a href="https://github.com/CaSh007s">GitHub</a> •
    <a href="https://github.com/CaSh007s/cortex">Repository</a>
  </p>
</div>
