"use client";

import { useParams } from "next/navigation";
import { ChatInterface } from "@/components/ChatInterface";
import { Sidebar } from "@/components/Sidebar";

export default function NotebookPage() {
  const params = useParams();
  
  if (!params?.notebookId) return null;
  const notebookId = params.notebookId as string;

  return (
    <div className="flex h-screen w-full bg-black text-white overflow-hidden">
        <Sidebar notebookId={notebookId} />
        <main className="flex-1 flex flex-col relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black pointer-events-none" />
            <div className="flex-1 p-6 flex items-center justify-center z-10">
                <ChatInterface notebookId={notebookId} />
            </div>
        </main>
    </div>
  );
}