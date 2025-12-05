"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { Moon, Sun, Trash2, LogOut, Shield, Mail, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const router = useRouter();

  // 1. Fetch User
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // 2. Escape Key Listener
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.back();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen p-8 md:p-12 max-w-4xl mx-auto text-white">
      
      {/* Header with Back Button */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 flex items-center gap-4"
      >
        <button 
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
            <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
            <h1 className="text-4xl font-bold">Settings</h1>
            <p className="text-slate-400">Manage your profile and preferences.</p>
        </div>
      </motion.div>

      <div className="space-y-8">
        
        {/* Account Section */}
        <SettingsSection title="Account" delay={0.1}>
            <div className="flex items-center gap-6 p-4">
                <div className="relative">
                    {user?.user_metadata?.avatar_url ? (
                        <img 
                            src={user.user_metadata.avatar_url} 
                            alt="Avatar" 
                            className="w-20 h-20 rounded-full border-2 border-indigo-500/50"
                        />
                    ) : (
                        <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-2xl font-bold">
                            {user?.email?.[0].toUpperCase()}
                        </div>
                    )}
                    <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-4 border-[#0B0C15]" title="Online" />
                </div>

                <div className="flex-1">
                    <h3 className="text-xl font-semibold">{user?.user_metadata?.full_name || "User"}</h3>
                    <div className="flex items-center gap-2 text-slate-400 mt-1">
                        <Mail className="w-4 h-4" />
                        <span>{user?.email}</span>
                    </div>
                </div>

                <button 
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-all flex items-center gap-2"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </div>
        </SettingsSection>

        {/* Appearance Section */}
        <SettingsSection title="Appearance" delay={0.2}>
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
                        {theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </div>
                    <div>
                        <h4 className="font-medium">Interface Theme</h4>
                        <p className="text-sm text-slate-400">Select your preferred workspace aesthetic.</p>
                    </div>
                </div>

                {/* Toggle Switch with Gap */}
                <div className="flex bg-black/40 p-1.5 rounded-lg border border-white/10 gap-2"> {/* Added gap-2 here */}
                    <button 
                        onClick={() => setTheme("dark")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${theme === 'dark' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        Deep Space
                    </button>
                    <button 
                        onClick={() => setTheme("light")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${theme === 'light' ? 'bg-white text-black shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        Nebula
                    </button>
                </div>
            </div>
        </SettingsSection>

        {/* Privacy Section */}
        <SettingsSection title="Privacy & Data" delay={0.3}>
            <div className="p-4 border-b border-white/5 flex items-center justify-between group cursor-pointer hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-500/10 rounded-lg text-green-400">
                        <Shield className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-medium group-hover:text-green-400 transition-colors">Row-Level Security</h4>
                        <p className="text-sm text-slate-400">Your data is encrypted and isolated.</p>
                    </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold border border-green-500/20">
                    ACTIVE
                </div>
            </div>

            <div className="p-4 flex items-center justify-between hover:bg-red-500/5 transition-colors">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-500/10 rounded-lg text-red-400">
                        <Trash2 className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-medium text-red-400">Delete All Data</h4>
                        <p className="text-sm text-slate-400">Permanently remove all notebooks and vectors.</p>
                    </div>
                </div>
                
                <button 
                    onClick={() => alert("This feature is coming in Phase 3!")}
                    className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-all text-sm"
                >
                    Delete Data
                </button>
            </div>
        </SettingsSection>

      </div>
    </div>
  );
}

function SettingsSection({ title, children, delay }: { title: string, children: React.ReactNode, delay: number }) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden backdrop-blur-sm"
        >
            <div className="px-6 py-4 border-b border-white/10 bg-white/5">
                <h2 className="font-semibold text-lg">{title}</h2>
            </div>
            <div className="divide-y divide-white/5">
                {children}
            </div>
        </motion.div>
    )
}