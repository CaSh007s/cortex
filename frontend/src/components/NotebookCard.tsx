"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreVertical, Trash2, Edit2, FileText, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { secureFetch } from "@/lib/secureFetch";

interface Notebook {
  id: string;
  name: string;
  created_at: string;
  files: string[];
}

interface NotebookCardProps {
  notebook: Notebook;
  onUpdate: () => void;
}

export function NotebookCard({ notebook, onUpdate }: NotebookCardProps) {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(notebook.name);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- Actions ---
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await secureFetch(`${API_BASE}/api/notebooks/${notebook.id}`, { method: "DELETE" });
      onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
      setShowDeleteAlert(false);
    }
  };

  const handleRename = async () => {
    try {
      await secureFetch(`${API_BASE}/api/notebooks/${notebook.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      setIsRenaming(false);
      onUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div className="group relative h-[280px] flex flex-col justify-between rounded-3xl border border-white/10 bg-[#12121A] hover:border-indigo-500/30 hover:shadow-[0_0_30px_rgba(0,0,0,0.3)] transition-all duration-300 overflow-hidden">
        
        {/* Background Gradient Effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full group-hover:bg-indigo-500/10 transition-all" />

        {/* Top Section */}
        <div className="p-6 relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform duration-500">
               <span className="text-xl font-bold">{notebook.name.charAt(0).toUpperCase()}</span>
            </div>

            {/* Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white hover:bg-white/10">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#0B0C15] border-white/10 text-slate-300">
                <DropdownMenuItem onClick={() => setIsRenaming(true)} className="hover:bg-white/10 cursor-pointer">
                  <Edit2 className="w-4 h-4 mr-2" /> Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowDeleteAlert(true)} className="text-red-400 hover:bg-red-500/10 cursor-pointer">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Rename Mode vs Link Mode */}
          {isRenaming ? (
            <div className="flex items-center gap-2 mt-2">
              <Input 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)}
                className="bg-white/5 border-white/10 text-white h-9"
                autoFocus
              />
              <Button size="sm" onClick={handleRename} className="bg-indigo-600 hover:bg-indigo-500 h-9">Save</Button>
            </div>
          ) : (
            <Link href={`/dashboard/notebook/${notebook.id}`} className="block">
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-indigo-400 transition-colors line-clamp-2">
                {notebook.name}
                </h3>
                <p className="text-xs text-slate-500">
                Created {new Date(notebook.created_at).toLocaleDateString()}
                </p>
            </Link>
          )}
        </div>

        {/* Bottom Section (Stats) */}
        <Link href={`/dashboard/notebook/${notebook.id}`} className="p-6 border-t border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors mt-auto relative z-10">
          <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
             <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>{notebook.files?.length || 0} Sources</span>
             </div>
             <div className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat Ready</span>
             </div>
          </div>
        </Link>
      </div>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent className="bg-[#0B0C15] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notebook?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will permanently delete &quot;{notebook.name}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 hover:bg-white/5 text-slate-300">Cancel</AlertDialogCancel>
            <AlertDialogAction 
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white border-0"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}