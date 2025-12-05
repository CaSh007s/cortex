"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

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
        // 1. Ask Supabase if we have a user
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          // 2. No user? Kick them out!
          router.replace("/");
        } else {
          // 3. User exists? Let them see the page
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Auth check failed", error);
        router.replace("/");
      }
    };

    checkUser();
  }, [router]);

  // 4. Show Loading Screen while checking
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
          <p className="text-slate-400 animate-pulse">Verifying Credentials...</p>
        </div>
      </div>
    );
  }

  // 5. Render the Dashboard (Sidebar + Page)
  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      {/* Note: Sidebar is rendered inside page.tsx or here depending on your structure. 
          If your Sidebar is in page.tsx, this just wraps it. 
          If you want the Sidebar persistent across dashboard pages, add it here.
      */}
      {children}
    </div>
  );
}