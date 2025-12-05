"use client";

import { useEffect, useState } from "react";
import { FileText, Database, ArrowLeft, Trash2, Loader2, LogOut } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileUpload } from "@/components/FileUpload";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation"; // <--- FIXED: This was missing

interface SidebarProps {
  notebookId: string;
}
import { secureFetch } from "@/lib/secureFetch";

export function Sidebar({ notebookId }: SidebarProps) {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const [files, setFiles] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  
  // User State
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // 1. Fetch User on Mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // 2. Handle Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/"); 
  };

  // 3. Fetch Files Logic
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const res = await secureFetch(`${API_BASE}/api/notebooks/${notebookId}`);
        if (res.ok) {
          const data = await res.json();
          setFiles(data.files || []);
        }
      } catch (err) {
        console.error("Failed to load sources", err);
      }
    };
    fetchFiles();
  }, [notebookId]);

  // 4. Refresh Helper
  const handleUploadComplete = () => {
     secureFetch(`${API_BASE}/api/notebooks/${notebookId}`)
      .then(res => res.json())
      .then(data => setFiles(data.files || []));
  };

  // 5. Delete Logic
  const handleDelete = async (filename: string) => {
    if (!confirm(`Are you sure you want to remove ${filename}?`)) return;
    
    setDeleting(filename);
    try {
      const res = await secureFetch(`${API_BASE}/api/notebooks/${notebookId}/files/${filename}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f !== filename));
      }
    } catch (err) {
      console.error("Failed to delete", err);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="w-80 h-full border-r border-white/10 bg-black/40 backdrop-blur-xl flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 text-slate-400">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <Database className="w-4 h-4 text-indigo-400" />
            <span>Sources</span>
        </div>
      </div>

      {/* File List (Takes up remaining space) */}
      <div className="flex-1 overflow-hidden p-4">
        <ScrollArea className="h-full">
            <div className="space-y-2">
                {files.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-sm">
                        No sources yet. <br/> Upload a PDF to begin.
                    </div>
                ) : (
                    files.map((file, i) => (
                        <div key={i} className="group flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-2 rounded bg-indigo-500/20 text-indigo-300">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <span className="text-sm text-slate-300 truncate">{file}</span>
                            </div>

                            <button 
                                onClick={() => handleDelete(file)}
                                disabled={deleting === file}
                                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400 transition-all"
                                title="Remove Source"
                            >
                                {deleting === file ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    ))
                )}
            </div>
        </ScrollArea>
      </div>

      {/* Footer 1: Upload Area */}
      <div className="p-4 border-t border-white/10 bg-white/5">
        <FileUpload 
            notebookId={notebookId} 
            onUploadComplete={handleUploadComplete} 
        />
      </div>

      {/* Footer 2: User Profile (ADDED THIS) */}
      <div className="p-4 border-t border-white/10 bg-black/20">
        {user ? (
          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
              {/* Google Avatar */}
              {user.user_metadata.avatar_url ? (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-full border border-white/10"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                  {user.email?.[0].toUpperCase()}
                </div>
              )}
              
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white">
                  {user.user_metadata.full_name || "User"}
                </span>
                <span className="text-xs text-white/50 truncate max-w-[120px]">
                  {user.email}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button 
              onClick={handleLogout}
              className="text-white/40 hover:text-red-400 transition-colors"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <div className="text-white/50 text-sm flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
             <span>Loading...</span>
          </div>
        )}
      </div>
    </div>
  );
}