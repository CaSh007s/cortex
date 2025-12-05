"use client";

import { useEffect, useState, useCallback } from "react";
import { CreateNotebookModal } from "@/components/CreateNotebookModal";
import { NotebookCard } from "@/components/NotebookCard";
import { Plus } from "lucide-react";
import { secureFetch } from "@/lib/secureFetch";

type Notebook = {
  id: string;
  name: string;
  created_at: string;
  files: string[];
};

export default function Dashboard() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);

  // Base URL
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
 
  // 1. Define the actual fetching logic as a standalone function
  // We keep this separate so we can call it from the UI (manual refresh)
  const getNotebooks = async () => {
    try {
      const res = await secureFetch(`${API_BASE}/api/notebooks`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setNotebooks(data);
        } else {
          setNotebooks([]); 
        }
      }
    } catch (err) {
      console.error("Error fetching notebooks:", err);
    }
  };

  // 2. Initial Fetch on Mount
  useEffect(() => {
    getNotebooks();
    // We disable the exhaustive-deps rule here because we only want this to run ONCE on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen p-8 md:p-12 max-w-7xl mx-auto">
      <div className="mb-12 space-y-2">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          Knowledge Base
        </h1>
        <p className="text-slate-400 text-lg">Select a neural notebook to begin.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Create Trigger */}
        <CreateNotebookModal>
          <button className="w-full group relative h-48 rounded-2xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-300 flex flex-col items-center justify-center gap-4 cursor-pointer overflow-hidden">
            <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6 text-indigo-400" />
            </div>
            <span className="text-slate-300 font-medium group-hover:text-white transition-colors">
              Create New Notebook
            </span>
          </button>
        </CreateNotebookModal>

        {/* Notebook List */}
        {notebooks.map((nb) => (
          <NotebookCard 
            key={nb.id} 
            notebook={nb} 
            onUpdate={getNotebooks} // Pass the refresh function
          />
        ))}
      </div>
    </main>
  );
}