"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ChatInterface } from "@/components/ChatInterface";
import { secureFetch } from "@/lib/secureFetch";
import {
  Loader2,
  Key,
  Upload,
  FileText,
  CheckCircle,
  ArrowRight,
  SkipForward,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

type SetupStage = "loading" | "key" | "upload" | "ready";

export default function NotebookPage() {
  const params = useParams();
  const notebookId = params?.notebookId as string;
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const [setupStage, setSetupStage] = useState<SetupStage>("loading");
  const [apiKey, setApiKey] = useState("");
  const [savingKey, setSavingKey] = useState(false);
  const [keyError, setKeyError] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [uploadError, setUploadError] = useState("");

  // Step 1 & 2: Check Key Status, then Check File Count
  useEffect(() => {
    if (!notebookId) return;

    const checkSetupRequirements = async () => {
      try {
        // 1. Check if user has a key
        const keyRes = await secureFetch(
          `${API_BASE}/api/user/gemini-key/status`,
        );
        if (keyRes.ok) {
          const keyData = await keyRes.json();
          if (!keyData.hasKey) {
            setSetupStage("key");
            return;
          }
        } else {
          setSetupStage("key"); // If error, default to asking for key to be safe
          return;
        }

        // 2. If key exists, check if notebook has any context files
        const nbRes = await secureFetch(
          `${API_BASE}/api/notebooks/${notebookId}`,
        );
        if (nbRes.ok) {
          const nbData = await nbRes.json();
          if (!nbData.files || nbData.files.length === 0) {
            setSetupStage("upload");
            return;
          }
        }

        // 3. If has key and has files, ready for chat
        setSetupStage("ready");
      } catch (err) {
        console.error("Setup check error:", err);
        setSetupStage("ready"); // Fallback to ready, let ChatInterface handle it
      }
    };

    checkSetupRequirements();
  }, [notebookId, API_BASE]);

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

      // Move to next step (upload)
      setSetupStage("upload");
    } catch (err) {
      const error = err as Error;
      setKeyError(error.message || "An error occurred");
    } finally {
      setSavingKey(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadStatus("idle");
    setUploadError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("notebookId", notebookId);

    try {
      const response = await secureFetch(`${API_BASE}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || "Upload failed");
      }

      setUploadStatus("success");

      // Refresh sidebar file list if needed
      window.dispatchEvent(new Event("notebooks-updated"));

      // Short delay so user sees the success checkmark
      setTimeout(() => {
        setSetupStage("ready");
      }, 1000);
    } catch (err) {
      const error = err as Error;
      setUploadError(error.message || "An error occurred");
      setUploadStatus("error");
    } finally {
      setUploading(false);
    }
  };

  if (!notebookId) return null;

  return (
    <div className="relative h-full flex flex-col items-center justify-center">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black pointer-events-none" />

      <div className="relative z-10 w-full p-4 md:p-6 flex items-center justify-center min-h-[500px]">
        <AnimatePresence mode="wait">
          {/* STAGE: LOADING */}
          {setupStage === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 text-slate-500"
            >
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm font-medium tracking-widest uppercase">
                Initializing
              </p>
            </motion.div>
          )}

          {/* STAGE: ENTER KEY */}
          {setupStage === "key" && (
            <motion.div
              key="key"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="w-full max-w-md p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl"
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
                  Cortex uses the Gemini API. To ensure continuous availability,
                  please provide your own free Gemini API key to run queries
                  within this notebook.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Input
                    type="password"
                    placeholder="AIzaSy..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="bg-black/40 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500"
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
                  stored in the database.
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

          {/* STAGE: UPLOAD CONTEXT */}
          {setupStage === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="w-full max-w-md p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl"
            >
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                  <FileText className="w-8 h-8 text-indigo-400" />
                </div>
              </div>

              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Upload Context
                </h2>
                <p className="text-sm text-slate-400">
                  This notebook currently has no files. Upload a PDF or Text
                  file to provide context for the AI, or skip to chat directly.
                </p>
              </div>

              <div className="space-y-4">
                <div className="relative group">
                  <input
                    type="file"
                    accept=".pdf,.txt"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setFile(e.target.files[0]);
                        setUploadStatus("idle");
                        setUploadError("");
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={uploading}
                  />
                  <div
                    className={`flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed transition-all ${file ? "border-indigo-500/50 bg-indigo-500/5" : "border-white/20 bg-white/5 group-hover:bg-white/10 group-hover:border-white/40"}`}
                  >
                    {file ? (
                      <div className="text-center">
                        <FileText className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                        <span className="text-sm font-medium text-slate-200 block truncate max-w-[200px]">
                          {file.name}
                        </span>
                        <span className="text-xs text-slate-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2 group-hover:text-indigo-400 transition-colors" />
                        <span className="text-sm font-medium text-slate-300">
                          Browse Files
                        </span>
                        <span className="text-xs text-slate-500 block mt-1">
                          PDF, TXT up to 10MB
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {uploadError && (
                  <p className="text-red-400 text-xs text-center">
                    {uploadError}
                  </p>
                )}

                <div className="flex items-center gap-3 pt-4">
                  <Button
                    variant="ghost"
                    onClick={() => setSetupStage("ready")}
                    disabled={uploading}
                    className="flex-1 text-slate-400 hover:text-white"
                  >
                    Skip <SkipForward className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={!file || uploading || uploadStatus === "success"}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium disabled:opacity-50"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                        Uploading...
                      </>
                    ) : uploadStatus === "success" ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" /> Success
                      </>
                    ) : (
                      <>
                        Upload & Start <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STAGE: READY (CHAT INTERFACE) */}
          {setupStage === "ready" && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full flex justify-center h-full"
            >
              <ChatInterface notebookId={notebookId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
