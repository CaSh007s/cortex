"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Info, Key, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { secureFetch } from "@/lib/secureFetch";

interface ApiKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ApiKeyModal({
  open,
  onOpenChange,
  onSuccess,
}: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setLoading(true);
    setError(null);

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

      setSuccess(true);
      localStorage.setItem("hasGeminiKey", "true");

      // Briefly show success state before closing
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
        setApiKey("");
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#1D1D21] border-white/10 text-white">
        <DialogHeader>
          <div className="mx-auto bg-indigo-500/10 p-3 rounded-full mb-4">
            <Key className="w-6 h-6 text-indigo-400" />
          </div>
          <DialogTitle className="text-xl text-center">
            Bring Your Own Key
          </DialogTitle>
          <DialogDescription className="text-center text-slate-400 pt-2">
            This app uses the Gemini API. To ensure continuous availability,
            please provide your own free Gemini API key to run queries.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="bg-black/20 border-white/10 text-white placeholder:text-slate-500 rounded-xl focus-visible:ring-indigo-500"
              disabled={loading || success}
              required
            />
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm mt-2">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-3 text-sm text-slate-300">
            <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p>
                Your key is securely encrypted on our servers using AES
                encryption before saving. It is never exposed.
              </p>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
              >
                Get your free API key here &rarr;
              </a>
            </div>
          </div>

          <DialogFooter className="sm:justify-stretch">
            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 transition-colors rounded-xl"
              disabled={!apiKey.trim() || loading || success}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Saved Successfully
                </>
              ) : (
                "Save and Continue"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
