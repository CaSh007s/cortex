"use client";

import { useState } from "react";
import Spline from '@splinetool/react-spline';
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { ArrowRight, Brain, Zap, Shield, Cpu } from "lucide-react";

export default function LandingPage() {
  const [loading, setLoading] = useState(false);

  // --- Login Logic ---
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
    <main className="relative bg-black min-h-screen text-white overflow-x-hidden">
      
      {/* 1. THE 3D BACKGROUND (Fixed) */}
      <div className="fixed inset-0 z-0">
        <Spline scene="https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black pointer-events-none" />
      </div>

      {/* 2. THE SCROLLABLE CONTENT (Foreground) */}
      <div className="relative z-10">
        
        {/* --- Section 1: The Hook --- */}
        <section className="h-screen flex flex-col items-center justify-center p-8">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-center"
          >
            <h1 className="text-7xl md:text-9xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 mb-6">
              CORTEX
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto font-light">
              Your Second Brain. <br/>
              <span className="text-indigo-400 font-semibold">Infinite Memory. Instant Recall.</span>
            </p>
            
            <motion.div 
              animate={{ y: [0, 10, 0] }} 
              transition={{ repeat: Infinity, duration: 2 }}
              className="mt-20 text-slate-500 text-sm"
            >
              Scroll to explore
            </motion.div>
          </motion.div>
        </section>

        {/* --- Section 2: The Problem --- */}
        <section className="h-screen flex items-center justify-start p-8 md:p-24 bg-gradient-to-b from-transparent to-black/80">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ margin: "-200px" }}
            transition={{ duration: 0.8 }}
            className="max-w-xl"
          >
            <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-6">
              <Brain className="w-6 h-6 text-indigo-400" />
            </div>
            <h2 className="text-5xl font-bold mb-6">Drowning in Data?</h2>
            <p className="text-xl text-slate-400 leading-relaxed">
              PDFs, research papers, documentation. The knowledge you need is buried in files you can&apos;t find. 
              <br/><br/>
              Cortex doesn&apos;t just store files. It <span className="text-white font-semibold">understands</span> them.
            </p>
          </motion.div>
        </section>

        {/* --- Section 3: The Solution (Right Aligned) --- */}
        <section className="h-screen flex items-center justify-end p-8 md:p-24 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ margin: "-200px" }}
            transition={{ duration: 0.8 }}
            className="max-w-xl text-right"
          >
             <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6 ml-auto">
              <Zap className="w-6 h-6 text-purple-400" />
            </div>
            <h2 className="text-5xl font-bold mb-6">Instant RAG Engine</h2>
            <p className="text-xl text-slate-400 leading-relaxed">
              Powered by Vector Search and LLMs. Ask complex questions across hundreds of documents and get cited answers in milliseconds.
            </p>
          </motion.div>
        </section>

        {/* --- Section 4: The Features (Grid) --- */}
        <section className="min-h-screen flex flex-col items-center justify-center p-8 bg-black">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full"
          >
            <FeatureCard 
              icon={<Brain />}
              title="Neural Search"
              desc="Forget keywords. Search by concept, idea, or meaning."
            />
            <FeatureCard 
              icon={<Shield />}
              title="Private & Secure"
              desc="Your data is encrypted. Row-Level Security ensures only you see your thoughts."
            />
            <FeatureCard 
              icon={<Cpu />}
              title="Multi-Modal"
              desc="Ingest PDFs, Websites, and Text. Cortex unifies your knowledge."
            />
          </motion.div>
        </section>

        {/* --- Section 5: The Call to Action --- */}
        <section className="h-[80vh] flex flex-col items-center justify-center bg-gradient-to-t from-indigo-900/20 to-black text-center p-8">
           <motion.div
             initial={{ scale: 0.9, opacity: 0 }}
             whileInView={{ scale: 1, opacity: 1 }}
             transition={{ duration: 0.5 }}
           >
             <h2 className="text-6xl font-bold mb-8">Ready to upgrade your mind?</h2>
             
             <button 
                onClick={handleLogin}
                disabled={loading}
                className="group relative inline-flex h-16 items-center justify-center overflow-hidden rounded-full bg-white px-10 font-medium text-black transition-all duration-300 hover:bg-slate-200 hover:w-64"
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
             
             <p className="mt-6 text-slate-500 text-sm">Powered by Gemini & Supabase</p>
           </motion.div>
        </section>
        
      </div>
    </main>
  );
}

// Helper Component for Features
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <div className="mb-4 text-indigo-400">{icon}</div>
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-slate-400">{desc}</p>
        </div>
    )
}