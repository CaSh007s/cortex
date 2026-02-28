"use client";

import { useEffect, useState } from "react";
import { CreateNotebookModal } from "@/components/CreateNotebookModal";
import { NotebookCard } from "@/components/NotebookCard";
import { Plus, Sparkles } from "lucide-react";
import { secureFetch } from "@/lib/secureFetch";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

type Notebook = {
  id: string;
  name: string;
  created_at: string;
  files: string[];
};

export default function Dashboard() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [userName, setUserName] = useState("Traveler");

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  // Fetch Notebooks
  const getNotebooks = async () => {
    try {
      const res = await secureFetch(`${API_BASE}/api/notebooks`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setNotebooks(data);
        else setNotebooks([]);
      }
    } catch (err) {
      console.error("Error fetching notebooks:", err);
    }
  };

  // Initial Load
  useEffect(() => {
    getNotebooks();

    // Fetch User Name for Greeting
    const getName = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name.split(" ")[0]);
      }
    };
    getName();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-full p-8 md:p-12 overflow-y-auto bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0B0C15] to-[#0B0C15]">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* 1. Dynamic Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
            <Sparkles className="w-3 h-3" />
            <span>Neural Core Online</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white">
            Hello,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              {userName}
            </span>
            .
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl">
            Welcome back to{" "}
            <span className="text-white font-semibold">Cortex</span>. You have{" "}
            <span className="text-indigo-400">
              {notebooks.length} active notebooks
            </span>{" "}
            ready for analysis.
          </p>
        </motion.div>

        {/* 2. Grid Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
          {/* Create Card (Always First) */}
          <CreateNotebookModal onSuccess={getNotebooks}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full group relative h-[280px] rounded-3xl border border-dashed border-white/10 bg-white/5 hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-4 cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="w-16 h-16 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center group-hover:border-indigo-500/50 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all duration-500">
                <Plus className="w-8 h-8 text-indigo-400" />
              </div>
              <span className="text-slate-300 font-medium group-hover:text-white transition-colors">
                New Notebook
              </span>
            </motion.button>
          </CreateNotebookModal>

          {/* Notebook Cards */}
          {notebooks.map((nb, i) => (
            <motion.div
              key={nb.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <NotebookCard notebook={nb} onUpdate={getNotebooks} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
