"use client";

import { useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, Sparkles, ArrowRight, Upload, FileText, 
  Globe, Link as LinkIcon, HardDrive, CheckCircle, 
  ArrowLeft, Loader2 // <--- ADDED Loader2 HERE
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type InputMode = "select" | "upload" | "url" | "paste";

export function CreateNotebookModal({ children }: { children: React.ReactNode }) {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<InputMode>("select");
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");

  const router = useRouter();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setMode("upload");
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);

    try {
      // 1. Create Notebook
      const res = await fetch(`${API_BASE}/api/notebooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to create notebook");
      const notebook = await res.json();
      
      // 2. Handle Ingestion
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("notebookId", notebook.id);
        await fetch(`${API_BASE}/api/upload`, { method: "POST", body: formData });
      
      } else if (mode === "paste" && text.trim()) {
        const blob = new Blob([text], { type: "text/plain" });
        const file = new File([blob], "pasted_text.txt", { type: "text/plain" });
        const formData = new FormData();
        formData.append("file", file);
        formData.append("notebookId", notebook.id);
        await fetch(`${API_BASE}/api/upload`, { method: "POST", body: formData });

      } else if (mode === "url" && url.trim()) {
        await fetch(`${API_BASE}/api/ingest-url`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url, notebookId: notebook.id })
        });
      }
      
      setOpen(false);
      router.push(`/notebook/${notebook.id}`);
      
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="glass border-white/10 bg-black/80 backdrop-blur-2xl sm:max-w-[600px] text-white p-0 gap-0 overflow-hidden">
        
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl font-light tracking-wide">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                New Notebook
            </DialogTitle>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <Label htmlFor="name" className="text-slate-400 font-medium">Notebook Title</Label>
            <Input
              id="name"
              placeholder="e.g., Market Research"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500/50 h-12 text-lg"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-slate-400 font-medium">Add Source</Label>
            
            {mode === "select" && (
                <div className="grid grid-cols-3 gap-3">
                    <div className="relative group flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                        <input type="file" accept=".pdf" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                        <Upload className="w-6 h-6 text-indigo-400" />
                        <span className="text-xs text-slate-300">Upload PDF</span>
                    </div>

                    <button onClick={() => setMode("url")} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all">
                        <Globe className="w-6 h-6 text-emerald-400" />
                        <span className="text-xs text-slate-300">Website</span>
                    </button>

                    <button onClick={() => setMode("paste")} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all">
                        <FileText className="w-6 h-6 text-amber-400" />
                        <span className="text-xs text-slate-300">Paste Text</span>
                    </button>
                </div>
            )}

            {mode === "upload" && selectedFile && (
                <div className="flex items-center justify-between p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                        <span className="text-sm text-emerald-100">{selectedFile.name}</span>
                    </div>
                    <button onClick={() => { setSelectedFile(null); setMode("select"); }} className="text-xs text-emerald-400 hover:underline">Change</button>
                </div>
            )}

            {mode === "url" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Enter Website URL</span>
                        <button onClick={() => setMode("select")} className="text-xs text-indigo-400 hover:underline flex items-center gap-1"><ArrowLeft className="w-3 h-3"/> Back</button>
                    </div>
                    <Input 
                        placeholder="https://example.com/article"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="bg-black/40 border-emerald-500/30 text-emerald-400 focus-visible:ring-emerald-500/50"
                    />
                </div>
            )}

            {mode === "paste" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Paste Content</span>
                        <button onClick={() => setMode("select")} className="text-xs text-indigo-400 hover:underline flex items-center gap-1"><ArrowLeft className="w-3 h-3"/> Back</button>
                    </div>
                    <textarea 
                        className="w-full h-32 p-3 rounded-md bg-black/40 border border-amber-500/30 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                        placeholder="Paste your text here..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setOpen(false)} className="hover:bg-white/5 text-slate-400 hover:text-white">Cancel</Button>
            <Button 
                onClick={handleCreate} 
                disabled={loading || !name.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white min-w-[140px]"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Notebook"}
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}