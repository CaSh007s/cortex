"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar"; // <--- NEW IMPORT

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) router.replace("/");
        else setIsLoading(false);
      } catch (error) {
        router.replace("/");
      }
    };
    checkUser();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-white">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0B0C15] text-white overflow-hidden">
      {/* 1. The Persistent Sidebar */}
      <AppSidebar />
      
      {/* 2. The Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#0B0C15]">
        {children}
      </main>
    </div>
  );
}