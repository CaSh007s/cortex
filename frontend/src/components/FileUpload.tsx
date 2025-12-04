"use client";

import { useState, ChangeEvent } from "react";
import { Upload, CheckCircle, AlertCircle, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

// Accept notebookId and a callback
interface FileUploadProps {
  notebookId: string;
  onUploadComplete?: () => void;
}

export function FileUpload({ notebookId, onUploadComplete }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus("idle");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setStatus("idle");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("notebookId", notebookId);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Upload failed");
      
      setStatus("success");
      setFile(null); // Reset file input
      if (onUploadComplete) onUploadComplete(); // Refresh parent
      
      // Reset success status after 3 seconds
      setTimeout(() => setStatus("idle"), 3000);
      
    } catch (error) {
      console.error(error);
      setStatus("error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >

      <div className="glass rounded-xl p-2 flex items-center gap-4">
        <div className="relative group flex-1">
            <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="flex items-center justify-center w-full h-10 rounded-lg border border-dashed border-white/20 bg-white/5 group-hover:bg-white/10 transition-colors">
                <span className="text-xs text-slate-400 flex items-center gap-2 truncate px-2">
                    <FileText className="w-3 h-3" />
                    {file ? file.name : "Add Source (PDF)"}
                </span>
            </div>
        </div>

        <Button 
          onClick={handleUpload} 
          disabled={!file || uploading}
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-500 text-white border-0 h-10"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : status === "success" ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
        </Button>
      </div>
    </motion.div>
  );
}