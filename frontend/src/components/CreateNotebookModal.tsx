"use client";

import { useState, ChangeEvent, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sparkles,
  Upload,
  FileText,
  Globe,
  HardDrive,
  CheckCircle,
  ArrowLeft,
  Loader2,
  Key,
  ArrowRight,
} from "lucide-react";
import { secureFetch } from "@/lib/secureFetch";
import { motion, AnimatePresence } from "framer-motion";

type InputMode = "select" | "upload" | "url" | "paste";
type SetupStage = "loading" | "key" | "create";

interface CreateNotebookModalProps {
  children: React.ReactNode;
  onSuccess?: () => void;
}

export function CreateNotebookModal({
  children,
  onSuccess,
}: CreateNotebookModalProps) {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Multi-stage state
  const [setupStage, setSetupStage] = useState<SetupStage>("loading");

  // Key Stage State
  const [apiKey, setApiKey] = useState("");
  const [savingKey, setSavingKey] = useState(false);
  const [keyError, setKeyError] = useState("");

  // Create Stage State
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<InputMode>("select");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");

  const checkKeyStatus = useCallback(async () => {
    try {
      const keyRes = await secureFetch(
        `${API_BASE}/api/user/gemini-key/status`,
      );
      if (keyRes.ok) {
        const keyData = await keyRes.json();
        if (!keyData.hasKey) {
          setSetupStage("key");
        } else {
          setSetupStage("create");
        }
      } else {
        setSetupStage("key"); // fallback
      }
    } catch (err) {
      console.error("Key check error:", err);
      setSetupStage("key");
    }
  }, [API_BASE]);

  // When modal opens, check key status
  useEffect(() => {
    if (open) {
      setSetupStage("loading");
      checkKeyStatus();
    } else {
      // Reset state on close
      setSetupStage("loading");
      setApiKey("");
      setName("");
      setSelectedFile(null);
      setUrl("");
      setText("");
      setMode("select");
    }
  }, [open, checkKeyStatus]);

  const handleSaveKey = async () => {
    if (!apiKey.trim()) return;
    setSavingKey(true);
    setKeyError("");

    try {
      const response = await secureFetch(`${API_BASE}/api/user/gemini-key`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to save API key");
      }

      localStorage.setItem("hasGeminiKey", "true");
      setApiKey("");
      setSetupStage("create");
    } catch (err) {
      const error = err as Error;
      setKeyError(error.message || "An error occurred");
    } finally {
      setSavingKey(false);
    }
  };

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
      const res = await secureFetch(`${API_BASE}/api/notebooks`, {
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
        await secureFetch(`${API_BASE}/api/upload`, {
          method: "POST",
          body: formData,
        });
      } else if (mode === "paste" && text.trim()) {
        const blob = new Blob([text], { type: "text/plain" });
        const file = new File([blob], "pasted_text.txt", {
          type: "text/plain",
        });
        const formData = new FormData();
        formData.append("file", file);
        formData.append("notebookId", notebook.id);
        await secureFetch(`${API_BASE}/api/upload`, {
          method: "POST",
          body: formData,
        });
      } else if (mode === "url" && url.trim()) {
        await secureFetch(`${API_BASE}/api/ingest-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, notebookId: notebook.id }),
        });
      }

      // 3. Cleanup
      setOpen(false);
      window.dispatchEvent(new Event("notebooks-updated"));

      if (onSuccess) onSuccess();
      else router.push(`/dashboard/notebook/${notebook.id}`);
    } catch (error) {
      console.error(error);
      alert("Error creating notebook.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      {/* We use a transparent wrapper so animations inside can dictate the box */}
      <DialogContent className="border-0 bg-transparent shadow-none p-0 overflow-visible max-w-none flex justify-center">
        <DialogTitle className="sr-only">New Notebook</DialogTitle>
        <DialogDescription className="sr-only">
          Setup your new notebook
        </DialogDescription>

        <AnimatePresence mode="wait">
          {setupStage === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center p-12 bg-black/80 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl"
            >
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
              <p className="text-sm font-medium tracking-widest uppercase text-slate-400">
                Initializing
              </p>
            </motion.div>
          )}

          {setupStage === "key" && (
            <motion.div
              key="key"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="w-full max-w-md p-8 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl"
            >
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                  <Key className="w-8 h-8 text-indigo-400" />
                </div>
              </div>

              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Bring Your Own Key
                </h2>
                <p className="text-sm text-slate-400">
                  Cortex uses the Gemini API. Please provide your own free
                  Gemini API key to run queries. This key will be saved for all
                  notebooks.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Input
                    type="password"
                    placeholder="AIzaSy..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveKey();
                    }}
                  />
                  {keyError && (
                    <p className="text-red-400 text-xs mt-2 text-center">
                      {keyError}
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleSaveKey}
                  disabled={!apiKey.trim() || savingKey}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                >
                  {savingKey ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Securely
                      Saving...
                    </>
                  ) : (
                    <>
                      Save Key & Continue{" "}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-slate-500 text-center mt-4">
                  Your key is securely encrypted using AES-256 before being
                  stored.
                  <br />
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 mt-2 inline-block"
                  >
                    Get your free API key here
                  </a>
                </p>
              </div>
            </motion.div>
          )}

          {setupStage === "create" && (
            <motion.div
              key="create"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="w-full max-w-[600px] bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-2 text-xl font-light tracking-wide text-white">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  New Notebook
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-slate-400 font-medium">
                    Notebook Title
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., Market Research"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500/50 h-12 text-lg"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-slate-400 font-medium">
                    Add Source
                  </Label>

                  {mode === "select" && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="relative group flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <Upload className="w-6 h-6 text-indigo-400" />
                        <span className="text-xs text-slate-300">
                          Upload PDF
                        </span>
                      </div>

                      <button
                        onClick={() => setMode("url")}
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
                      >
                        <Globe className="w-6 h-6 text-emerald-400" />
                        <span className="text-xs text-slate-300">Website</span>
                      </button>

                      {/* Google Drive - COMING SOON */}
                      <button
                        disabled
                        className="relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-white/5 bg-white/5 opacity-50 cursor-not-allowed group overflow-hidden"
                      >
                        <div className="absolute top-2 right-2 bg-indigo-500/20 text-indigo-300 text-[9px] font-bold px-1.5 py-0.5 rounded border border-indigo-500/30">
                          SOON
                        </div>
                        <HardDrive className="w-6 h-6 text-slate-500" />
                        <span className="text-xs text-slate-500">
                          Google Drive
                        </span>
                      </button>

                      <button
                        onClick={() => setMode("paste")}
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
                      >
                        <FileText className="w-6 h-6 text-amber-400" />
                        <span className="text-xs text-slate-300">
                          Paste Text
                        </span>
                      </button>
                    </div>
                  )}

                  {mode === "upload" && selectedFile && (
                    <div className="flex items-center justify-between p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 fade-in zoom-in-95 animate-in duration-300">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                        <span className="text-sm text-emerald-100 truncate max-w-[200px] md:max-w-xs">
                          {selectedFile.name}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedFile(null);
                          setMode("select");
                        }}
                        className="text-xs text-emerald-400 hover:underline shrink-0"
                      >
                        Change
                      </button>
                    </div>
                  )}

                  {mode === "url" && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          Enter Website URL
                        </span>
                        <button
                          onClick={() => setMode("select")}
                          className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          <ArrowLeft className="w-3 h-3" /> Back
                        </button>
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
                        <span className="text-xs text-slate-400">
                          Paste Content
                        </span>
                        <button
                          onClick={() => setMode("select")}
                          className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          <ArrowLeft className="w-3 h-3" /> Back
                        </button>
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
                <Button
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  className="hover:bg-white/5 text-slate-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={loading || !name.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white min-w-[140px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                      Creating...
                    </>
                  ) : (
                    "Create Notebook"
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
