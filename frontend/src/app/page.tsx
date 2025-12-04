"use client";

import { useEffect, useState } from "react";
import { CreateNotebookModal } from "@/components/CreateNotebookModal";
import { NotebookCard } from "@/components/NotebookCard"; // Import New Component
import { Plus } from "lucide-react";

type Notebook = {
  id: string;
  name: string;
  created_at: string;
  files: string[];
};

export default function Dashboard() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);

  // Function to refresh list
  const fetchNotebooks = () => {
    fetch("http://127.0.0.1:8000/api/notebooks")
      .then((res) => res.json())
      .then((data) => setNotebooks(data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchNotebooks();
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

        {/* Notebook List using the New Card */}
        {notebooks.map((nb) => (
          <NotebookCard 
            key={nb.id} 
            notebook={nb} 
            onUpdate={fetchNotebooks} // Pass refresh function
          />
        ))}
      </div>
    </main>
  );
}