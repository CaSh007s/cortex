"use client";

import { useState } from "react";
import Link from "next/link";
import { Book, Clock, MoreVertical, Trash2, Edit2, Loader2 } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
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
import { Button } from "@/components/ui/button";

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(notebook.name);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await fetch(`${API_BASE}/api/notebooks/${notebook.id}`, {
        method: "DELETE",
      });
      onUpdate();
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
      setShowDeleteAlert(false);
    }
  };

  const handleRename = async () => {
    if (!newName.trim() || newName === notebook.name) {
      setIsEditing(false);
      return;
    }
    
    try {
      await fetch(`${API_BASE}/api/notebooks/${notebook.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      onUpdate();
    } catch (error) {
      console.error(error);
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <>
      <div className="group relative h-48 glass rounded-2xl p-6 flex flex-col justify-between hover:border-indigo-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(79,70,229,0.15)]">
        
        {/* Header Section */}
        <div>
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Book className="w-5 h-5" />
            </div>
            
            {/* The "Three Dots" Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 rounded-md text-slate-500 hover:text-white hover:bg-white/10 transition-colors z-20 relative">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-black/90 border-white/10 backdrop-blur-xl text-slate-300">
                <DropdownMenuItem onClick={() => setIsEditing(true)} className="hover:bg-white/10 cursor-pointer">
                  <Edit2 className="w-4 h-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem 
                    onClick={() => setShowDeleteAlert(true)} 
                    className="hover:bg-red-500/20 text-red-400 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Title Area (Editable) */}
          {isEditing ? (
            <div className="flex items-center gap-2 z-20 relative">
              <Input 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)}
                className="h-8 bg-white/10 border-white/20 text-white"
                autoFocus
              />
              <Button size="sm" onClick={handleRename} className="h-8 bg-indigo-600 hover:bg-indigo-500">
                Save
              </Button>
            </div>
          ) : (
            <Link href={`/notebook/${notebook.id}`} className="absolute inset-0 z-10">
                {/* Invisible Link covering card except menu */}
            </Link>
          )}
          
          {!isEditing && (
            <h3 className="text-xl font-semibold text-slate-200 group-hover:text-white transition-colors truncate mt-2">
                {notebook.name}
            </h3>
          )}
        </div>
        
        {/* Footer Info */}
        <div className="flex items-center justify-between mt-4">
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/5 text-slate-400 border border-white/10">
              {notebook.files.length} sources
            </span>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              <span>{new Date(notebook.created_at).toLocaleDateString()}</span>
            </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent className="bg-black/90 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notebook?</AlertDialogTitle>
            {/* FIXED: Replaced " with &quot; */}
            <AlertDialogDescription className="text-slate-400">
              This will permanently delete &quot;{notebook.name}&quot; and remove all its vectors from the database. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 hover:bg-white/5 text-slate-300">Cancel</AlertDialogCancel>
            <AlertDialogAction 
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white border-0"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}