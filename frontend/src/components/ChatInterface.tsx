"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Send, Bot, User, Sparkles, FileText, Mic, MicOff } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { Typewriter } from "@/components/Typewriter";
import { ThinkingWave } from "@/components/ThinkingWave";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { secureFetch } from "@/lib/secureFetch";
import { useVoice } from '@/hooks/useVoice';

interface ChatInterfaceProps {
  notebookId: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: (string | { page: number; source: string })[]; 
}

export function ChatInterface({ notebookId }: ChatInterfaceProps) {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  
  // --- 1. Voice Hook Integration ---
  const { isListening, transcript, toggleListening, speak, hasSupport } = useVoice();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "System Online. Ready to analyze your documents.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- 2. Sync Voice Transcript to Input Box ---
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  // Load Chat History
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await secureFetch(`${API_BASE}/api/notebooks/${notebookId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
            setMessages(data.messages);
          } 
        }
      } catch (err) {
        console.error("Failed to load history", err);
      }
    };
    fetchHistory();
  }, [notebookId, API_BASE]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await secureFetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            message: userMessage.content,
            notebookId: notebookId 
        }),
      });

      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.json();
      
      const aiMessage: Message = {
        role: "assistant",
        content: data.answer,
        sources: data.sources,
      };
      setMessages((prev) => [...prev, aiMessage]);

      // --- 3. Speak the Answer (Jarvis Mode) ---
      speak(data.answer);
      
    } catch (error) {
      console.error(error);
      
      // --- MOCK RESPONSE FOR TESTING (Use this when API is down) ---
      const offlineMessage = "I cannot reach the neural core (API Quota Exceeded), but my voice module is working perfectly. I can hear you, and I can speak to you.";
      
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: offlineMessage },
      ]);
      
      // Force the speaker to read this error message
      speak(offlineMessage); 
      // -----------------------------------------------------------

    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="w-full max-w-4xl h-[700px] flex flex-col gradient-border rounded-2xl overflow-hidden shadow-2xl"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-black/20">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <h2 className="text-sm font-medium text-slate-200 tracking-wide">LIVE SESSION</h2>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-hidden relative">
        <ScrollArea className="h-full p-6">
          <div className="space-y-6">
            <AnimatePresence>
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {/* AI Avatar */}
                  {msg.role === "assistant" && (
                    <Avatar className="h-8 w-8 border border-white/10">
                      <AvatarFallback className="bg-indigo-600/20 text-indigo-300">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  {/* Bubble */}
                  <div
                    className={`rounded-2xl p-4 max-w-[80%] text-sm leading-relaxed shadow-lg ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white"
                        : "bg-white/5 border border-white/10 text-slate-100"
                    }`}
                  >
                    {msg.role === "assistant" && index === messages.length - 1 && !loading ? (
                      <Typewriter content={msg.content} speed={15} />
                    ) : (
                      <div className="prose prose-invert max-w-none text-sm">
                         <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}

                    {/* Citations */}
                    {Array.isArray(msg.sources) && msg.sources.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-white/5">
                        {msg.sources.map((source, idx) => {
                          const pageNum = typeof source === 'object' && source.page ? source.page : '1';
                          const fileName = typeof source === 'object' && source.source ? source.source : String(source);
                          
                          return (
                            <HoverCard key={idx}>
                              <HoverCardTrigger asChild>
                                <button className="flex items-center gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/40 px-2.5 py-1 rounded-full text-xs font-medium text-indigo-300 transition-all group">
                                  <Sparkles className="w-3 h-3 text-indigo-400 group-hover:text-indigo-300" />
                                  <span>Pg {pageNum}</span>
                                </button>
                              </HoverCardTrigger>
                              <HoverCardContent className="w-80 p-0 bg-black/90 border-white/10 backdrop-blur-xl">
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2 p-3 border-b border-white/10 bg-white/5">
                                    <FileText className="w-4 h-4 text-indigo-400" />
                                    <p className="text-sm font-medium text-slate-200 truncate">
                                      {fileName}
                                    </p>
                                  </div>
                                  <div className="p-3">
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                      Referenced from Page {pageNum}. 
                                      This segment was identified as highly relevant to your query.
                                    </p>
                                  </div>
                                </div>
                              </HoverCardContent>
                            </HoverCard>
                          );
                        })}
                      </div>
                    )}
                  </div>

                   {/* User Avatar */}
                   {msg.role === "user" && (
                    <Avatar className="h-8 w-8 border border-white/10">
                      <AvatarFallback className="bg-slate-700 text-slate-300">
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
               <motion.div 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }}
                 className="flex gap-4"
               >
                 <Avatar className="h-8 w-8 border border-white/10">
                    <AvatarFallback className="bg-indigo-600/20 text-indigo-300">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
                    <ThinkingWave />
                    <span className="text-xs text-slate-400 animate-pulse">Thinking...</span>
                  </div>
               </motion.div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 bg-black/20">
        <div className="relative flex items-center gap-2">
            
            {/* --- 4. Voice Input Button --- */}
            {hasSupport && (
              <Button
                onClick={toggleListening}
                size="icon"
                variant="ghost"
                className={`rounded-full transition-all duration-300 ${
                  isListening 
                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 animate-pulse border border-red-500/50" 
                    : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
            )}

            <Input
              placeholder={isListening ? "Listening..." : "Ask anything..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className={`bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-full py-6 px-6 focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500 transition-all duration-300 shadow-[0_0_20px_rgba(99,102,241,0.1)] focus:shadow-[0_0_30px_rgba(99,102,241,0.3)] ${
                isListening ? "ring-2 ring-red-500/50 border-red-500/50 placeholder:text-red-400" : ""
              }`}
            />
            
            <Button 
                onClick={handleSend} 
                disabled={loading} 
                size="icon"
                className="h-10 w-10 bg-indigo-600 hover:bg-indigo-500 rounded-full shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
        </div>
      </div>
    </motion.div>
  );
}