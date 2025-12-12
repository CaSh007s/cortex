"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { ArrowRight, Brain, Zap, Shield, Database, Search, FileText } from "lucide-react";

export default function LandingPage() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) {
      console.error("Login failed:", error.message);
      setLoading(false);
    }
  };

  return (
    <main className="relative bg-black min-h-screen text-white overflow-x-hidden selection:bg-indigo-500/30">
      
      {/* 1. BACKGROUND ENGINE (Updated with Mask Fix) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* The Mask: 
            transparent_10% at center -> black_60% at edges.
            This creates a "hole" in the middle where lines are invisible.
        */}
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black_70%)]">
            
            {/* Grid Background (Optional subtle texture) */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

            {/* Vertical Green Line (The one that was cutting the R) */}
            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-emerald-500/0 via-emerald-500/40 to-emerald-500/0" />
            
            {/* Diagonal Lines (Perspective) */}
            <div className="absolute top-1/2 left-1/2 w-[200%] h-px -translate-x-1/2 -translate-y-1/2 bg-indigo-500/30 rotate-45 blur-[1px]" />
            <div className="absolute top-1/2 left-1/2 w-[200%] h-px -translate-x-1/2 -translate-y-1/2 bg-rose-500/30 -rotate-45 blur-[1px]" />
        </div>

        {/* Center Glow (Behind Text) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-500/10 blur-[120px] rounded-full" />
      </div>

      {/* 2. FOREGROUND CONTENT */}
      <div className="relative z-10">
        
        {/* HERO SECTION */}
        <section className="h-screen flex flex-col items-center justify-center p-8">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-center relative"
          >
            {/* Text Glow */}
            <div className="absolute -inset-10 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
            
            <h1 className="text-7xl md:text-[10rem] font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/10 mb-6 drop-shadow-2xl relative z-20">
              CORTEX
            </h1>
            <p className="text-xl md:text-3xl text-slate-300 max-w-2xl mx-auto font-light tracking-wide relative z-20">
              Your Second Brain. <br/>
              <span className="text-indigo-400 font-semibold">Infinite Memory. Instant Recall.</span>
            </p>
            
            <motion.div 
              animate={{ y: [0, 10, 0] }} 
              transition={{ repeat: Infinity, duration: 2 }}
              className="mt-32 text-slate-500 text-xs uppercase tracking-[0.2em]"
            >
              Scroll to Initialize
            </motion.div>
          </motion.div>
        </section>

        {/* THE PIPELINE */}
        <section className="min-h-screen flex flex-col justify-center px-8 md:px-24 bg-gradient-to-b from-transparent via-black/80 to-black">
          <div className="max-w-5xl mx-auto w-full">
            <motion.h2 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className="text-4xl md:text-6xl font-bold mb-20 text-center"
            >
                How Cortex <span className="text-indigo-500">Thinks</span>
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-500/0 via-indigo-500/50 to-indigo-500/0" />

                <StepCard 
                    icon={<FileText />}
                    step="01"
                    title="Ingest"
                    desc="Upload PDFs, paste text, or link websites. Cortex fragments your data into semantic vectors."
                    delay={0.2}
                />
                <StepCard 
                    icon={<Database />}
                    step="02"
                    title="Index"
                    desc="Your knowledge is stored in a high-dimensional vector space, creating a map of meaning."
                    delay={0.4}
                />
                <StepCard 
                    icon={<Search />}
                    step="03"
                    title="Retrieve"
                    desc="Ask anything. Cortex finds the exact paragraph and generates a cited answer instantly."
                    delay={0.6}
                />
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section className="min-h-screen flex items-center justify-center p-8 bg-black">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl w-full">
            <BentoCard 
                title="Neural Search" 
                desc="Forget keywords. Search by concept, idea, or vague memory."
                icon={<Brain className="w-8 h-8 text-indigo-400" />}
                colSpan="md:col-span-2"
            />
            <BentoCard 
                title="Total Privacy" 
                desc="Row-Level Security (RLS) ensures your thoughts remain yours."
                icon={<Shield className="w-8 h-8 text-emerald-400" />}
            />
            <BentoCard 
                title="Multi-Modal" 
                desc="PDFs, MD, TXT, and URLs supported."
                icon={<Zap className="w-8 h-8 text-amber-400" />}
            />
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="h-[80vh] flex flex-col items-center justify-center bg-gradient-to-t from-indigo-900/40 to-black text-center p-8">
           <motion.div
             initial={{ scale: 0.9, opacity: 0 }}
             whileInView={{ scale: 1, opacity: 1 }}
             transition={{ duration: 0.5 }}
             className="relative z-10"
           >
             <h2 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight">Ready to upgrade your mind?</h2>
             
             <button 
                onClick={handleLogin}
                disabled={loading}
                className="group relative inline-flex h-16 items-center justify-center overflow-hidden rounded-full bg-white px-12 font-medium text-black transition-all duration-300 hover:bg-slate-200 hover:scale-105 hover:w-80 shadow-[0_0_40px_rgba(255,255,255,0.3)]"
             >
                <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">
                  <div className="relative h-full w-8 bg-white/20" />
                </div>
                
                {loading ? (
                    <span>Connecting...</span>
                ) : (
                    <span className="flex items-center gap-2 text-lg">
                        Initialize Cortex <ArrowRight className="w-5 h-5" />
                    </span>
                )}
             </button>
             
             <p className="mt-8 text-slate-500 text-sm">Powered by Gemini & Supabase Vector</p>
           </motion.div>
        </section>
        
      </div>
    </main>
  );
}

// --- Components (Fixed Types) ---

function StepCard({ icon, step, title, desc, delay }: { icon: React.ReactNode, step: string, title: string, desc: string, delay: number }) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            className="relative p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md"
        >
            <div className="text-xs font-mono text-indigo-400 mb-4">STEP {step}</div>
            <div className="mb-4 text-white/80">{icon}</div>
            <h3 className="text-2xl font-bold mb-3">{title}</h3>
            <p className="text-slate-400 leading-relaxed">{desc}</p>
        </motion.div>
    )
}

function BentoCard({ title, desc, icon, colSpan = "" }: { title: string, desc: string, icon: React.ReactNode, colSpan?: string }) {
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className={`p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors ${colSpan}`}
        >
            <div className="mb-4">{icon}</div>
            <h3 className="text-2xl font-bold mb-2">{title}</h3>
            <p className="text-slate-400">{desc}</p>
        </motion.div>
    )
}