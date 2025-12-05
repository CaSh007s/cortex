"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Plus, LayoutGrid, MessageSquare, Settings, LogOut, 
  Loader2, ArrowLeft, Database, FileText, Trash2 
} from "lucide-react";
import { secureFetch } from "@/lib/secureFetch";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { CreateNotebookModal } from "@/components/CreateNotebookModal";
import { FileUpload } from "@/components/FileUpload";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

type NotebookSnippet = {
  id: string;
  name: string;
};

export function AppSidebar() {
  const [notebooks, setNotebooks] = useState<NotebookSnippet[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  
  const pathname = usePathname();
  const router = useRouter();
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  // Check if we are inside a specific notebook
  const notebookId = pathname.includes("/notebook/") ? pathname.split("/notebook/")[1]?.split("/")[0] : null;
  const isNotebookView = !!notebookId;

  // 1. GLOBAL INIT
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      try {
        const res = await secureFetch(`${API_BASE}/api/notebooks`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setNotebooks(data);
        }
      } catch (err) {
        console.error("Sidebar load error:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [API_BASE]);

  // 2. NOTEBOOK SPECIFIC: Fetch Files
  useEffect(() => {
    if (!notebookId) return;

    const fetchFiles = async () => {
      try {
        const res = await secureFetch(`${API_BASE}/api/notebooks/${notebookId}`);
        if (res.ok) {
          const data = await res.json();
          setFiles(data.files || []);
        }
      } catch (err) {
        console.error("Failed to load files", err);
      }
    };
    fetchFiles();
  }, [notebookId, API_BASE]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleUploadComplete = () => {
    if (!notebookId) return;
    secureFetch(`${API_BASE}/api/notebooks/${notebookId}`)
      .then(res => res.json())
      .then(data => setFiles(data.files || []));
  };

  const handleDeleteFile = async (filename: string) => {
    if (!notebookId) return;
    if (!confirm(`Remove ${filename}?`)) return;
    
    setDeletingFile(filename);
    try {
      const res = await secureFetch(`${API_BASE}/api/notebooks/${notebookId}/files/${filename}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f !== filename));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingFile(null);
    }
  };

  const currentNotebookName = notebooks.find(n => n.id === notebookId)?.name;

  return (
    <aside className="w-72 h-screen bg-[#0B0C15] border-r border-white/10 flex flex-col flex-shrink-0 transition-all duration-300 z-50">
      
      {/* --- HEADER --- */}
      <div className="p-4 border-b border-white/10 min-h-[80px] flex flex-col justify-center">
        {isNotebookView ? (
           <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 text-slate-400 shrink-0">
                    <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div className="flex flex-col overflow-hidden min-w-0">
                <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold">Notebook</span>
                <span className="text-sm font-medium text-white truncate" title={currentNotebookName}>
                    {currentNotebookName || "Loading..."}
                </span>
              </div>
           </div>
        ) : (
           <div className="animate-in fade-in slide-in-from-right-2 duration-300">
             <Link href="/dashboard" className="flex items-center gap-2 mb-4 group">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                    C
                </div>
                <span className="font-bold text-lg tracking-tight text-white">Cortex</span>
            </Link>
            
            <CreateNotebookModal onSuccess={() => window.location.reload()}>
                <button className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 py-2 rounded-lg text-sm font-medium transition-all group">
                    <Plus className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300" />
                    New Notebook
                </button>
            </CreateNotebookModal>
           </div>
        )}
      </div>

      {/* --- CONTENT LIST --- */}
      <div className="flex-1 overflow-hidden py-2 relative">
        {isNotebookView ? (
            // FILE LIST MODE
            <div className="h-full flex flex-col animate-in fade-in zoom-in-95 duration-300">
                <div className="px-4 mb-3 flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <Database className="w-3 h-3" />
                    <span>Sources ({files.length})</span>
                </div>
                
                <ScrollArea className="flex-1 px-2">
                    <div className="space-y-1">
                        {files.length === 0 ? (
                            <div className="text-center py-10 text-slate-600 text-xs">
                                No sources yet. <br/> Upload below.
                            </div>
                        ) : (
                            files.map((file, i) => (
                                <div key={i} className="group grid grid-cols-[1fr_auto] gap-2 items-center p-2 rounded-lg bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all">
    
                                {/* 1. Text Column (Strictly constrained) */}
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="p-1.5 shrink-0 rounded bg-indigo-500/20 text-indigo-300">
                                        <FileText className="w-3.5 h-3.5" />
                                    </div>
                                    {/* The truncate happens here, forced by the grid parent */}
                                    <span className="text-sm text-slate-300 truncate" title={file}>
                                        {file}
                                    </span>
                                </div>

                                {/* 2. Button Column (Fixed spot) */}
                                <button 
                                    onClick={() => handleDeleteFile(file)}
                                    disabled={deletingFile === file}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400 transition-all"
                                    title="Remove Source"
                                >
                                    {deletingFile === file ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-3.5 h-3.5" />
                                    )}
                                </button>
                            </div>
                            ))
                        )}
                    </div>
                </ScrollArea>

                <div className="p-4 border-t border-white/10 bg-white/5">
                    {notebookId && <FileUpload notebookId={notebookId} onUploadComplete={handleUploadComplete} />}
                </div>
            </div>
        ) : (
            // NOTEBOOK LIST MODE
            <div className="h-full flex flex-col animate-in fade-in zoom-in-95 duration-300">
                <div className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Menu
                </div>
                <nav className="px-2 space-y-1 mb-6">
                    <Link 
                        href="/dashboard"
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            pathname === "/dashboard" 
                            ? "bg-indigo-600/10 text-indigo-400" 
                            : "text-slate-400 hover:text-white hover:bg-white/5"
                        }`}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        Overview
                    </Link>
                </nav>

                <div className="px-4 mb-2 flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <span>Notebooks</span>
                    <span className="bg-white/10 px-1.5 rounded text-[10px]">{notebooks.length}</span>
                </div>
                
                <ScrollArea className="flex-1 px-2">
                    {loading ? (
                        <div className="flex items-center justify-center py-4 text-slate-600">
                            <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-0.5">
                            {notebooks.map((nb) => (
                                <Link 
                                    key={nb.id}
                                    href={`/dashboard/notebook/${nb.id}`}
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all group"
                                >
                                    <MessageSquare className="w-4 h-4 text-slate-600 group-hover:text-slate-400 shrink-0" />
                                    <span className="truncate">{nb.name}</span>
                                </Link>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>
        )}
      </div>

      {/* --- FOOTER --- */}
      <div className="p-4 border-t border-white/10 bg-black/20">
        {user ? (
            <div className="flex items-center justify-between group">
                <div 
                    onClick={() => router.push("/dashboard/settings")}
                    className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 -ml-2 rounded-lg transition-all flex-1 overflow-hidden"
                >
                    {user.user_metadata.avatar_url ? (
                        <img 
                            src={user.user_metadata.avatar_url} 
                            alt="Avatar" 
                            className="w-8 h-8 rounded-full border border-white/10"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                            {user.email?.[0].toUpperCase()}
                        </div>
                    )}
                    <div className="flex flex-col truncate min-w-0">
                        <span className="text-sm font-medium text-white truncate">
                            {user.user_metadata.full_name?.split(" ")[0] || "User"}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate">
                            {user.email}
                        </span>
                    </div>
                </div>
                
                <div className="flex items-center gap-0.5 shrink-0">
                    <button onClick={() => router.push("/dashboard/settings")} className="p-1.5 text-slate-500 hover:text-white transition-colors">
                        <Settings size={16} />
                    </button>
                    <button onClick={handleLogout} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors">
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        ) : (
            <div className="h-10 animate-pulse bg-white/5 rounded-lg" />
        )}
      </div>
    </aside>
  );
}