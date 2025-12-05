"use client";

import { useParams } from "next/navigation";
import { ChatInterface } from "@/components/ChatInterface";

export default function NotebookPage() {
  const params = useParams();
  
  if (!params?.notebookId) return null;
  const notebookId = params.notebookId as string;

  return (
    <div className="relative h-full flex flex-col">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black pointer-events-none" />
        
        {/* Chat Area - Centered and Full Height */}
        <div className="flex-1 p-4 md:p-6 flex items-center justify-center z-10 h-full">
            <ChatInterface notebookId={notebookId} />
        </div>
    </div>
  );
}