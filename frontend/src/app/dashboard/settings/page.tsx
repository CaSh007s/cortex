"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { Moon, Sun, Trash2, LogOut, Shield, Mail, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { secureFetch } from "@/lib/secureFetch"; // <--- Added Import

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

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

  // --- DELETE DATA LOGIC ---
  const handleDeleteAllData = async () => {
    if (!confirm("⚠️ ARE YOU SURE? This will permanently delete all your notebooks, files, and chats. This cannot be undone.")) {
      return;
    }

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const res = await secureFetch(`${API_BASE}/api/purge-account`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Account wiped. Redirecting...");
        // Redirect to dashboard (which will now be empty)
        router.push("/dashboard"); 
        // Optional: Force a hard reload to clear any cached states
        setTimeout(() => window.location.href = "/dashboard", 500);
      } else {
        alert("Failed to delete data. Check console.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while deleting data.");
    }
  };

  return (
    <div className="min-h-screen p-8 md:p-12 max-w-4xl mx-auto text-foreground transition-colors duration-300">
      
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 flex items-center gap-4"
      >
        <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-accent transition-colors">
            <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
            <h1 className="text-4xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your profile and preferences.</p>
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
                            className="w-20 h-20 rounded-full border-2 border-primary/50"
                        />
                    ) : (
                        <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
                            {user?.email?.[0].toUpperCase()}
                        </div>
                    )}
                </div>

                <div className="flex-1">
                    <h3 className="text-xl font-semibold">{user?.user_metadata?.full_name || "User"}</h3>
                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                        <Mail className="w-4 h-4" />
                        <span>{user?.email}</span>
                    </div>
                </div>

                <button 
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm font-medium transition-all flex items-center gap-2"
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
                    <div className="p-3 bg-primary/10 rounded-lg text-primary">
                        {theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </div>
                    <div>
                        <h4 className="font-medium">Interface Theme</h4>
                        <p className="text-sm text-muted-foreground">Select your preferred workspace aesthetic.</p>
                    </div>
                </div>

                <div className="flex bg-secondary p-1.5 rounded-lg border border-border gap-2">
                    <button 
                        onClick={() => setTheme("dark")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${theme === 'dark' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Deep Space
                    </button>
                    <button 
                        onClick={() => setTheme("light")}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${theme === 'light' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Nebula
                    </button>
                </div>
            </div>
        </SettingsSection>

        {/* Privacy Section */}
        <SettingsSection title="Privacy & Data" delay={0.3}>
            <div className="p-4 border-b border-border/50 flex items-center justify-between group cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-500">
                        <Shield className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-medium group-hover:text-emerald-500 transition-colors">Row-Level Security</h4>
                        <p className="text-sm text-muted-foreground">Your data is encrypted and isolated.</p>
                    </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-500 text-xs font-bold border border-emerald-500/20">
                    ACTIVE
                </div>
            </div>

            <div className="p-4 flex items-center justify-between hover:bg-destructive/10 transition-colors">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-destructive/10 rounded-lg text-destructive">
                        <Trash2 className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-medium text-destructive">Delete All Data</h4>
                        <p className="text-sm text-muted-foreground">Permanently remove all notebooks and vectors.</p>
                    </div>
                </div>
                
                {/* WIRED UP THE BUTTON HERE */}
                <button 
                    onClick={handleDeleteAllData}
                    className="px-4 py-2 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all text-sm"
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
            className="rounded-2xl border border-border bg-card/50 overflow-hidden backdrop-blur-sm"
        >
            <div className="px-6 py-4 border-b border-border bg-muted/20">
                <h2 className="font-semibold text-lg">{title}</h2>
            </div>
            <div className="divide-y divide-border">
                {children}
            </div>
        </motion.div>
    )
}