"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface SaveNoteDialogProps {
  open: boolean;
  noteContent: string;
  onClose: () => void;
  onSave: (title: string) => void;
}

export default function SaveNoteDialog({
  open,
  noteContent,
  onClose,
  onSave,
}: SaveNoteDialogProps) {
  const [noteTitle, setNoteTitle] = useState("untitled-note1");

  const handleSave = () => {
    onSave(noteTitle);
    setNoteTitle("untitled-note1"); // Reset for next time
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save this note?</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          <div className="space-y-2">
            <Input
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              className="text-slate-900"
              placeholder="Note title"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-[#C00000] hover:bg-[#A00000]"
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}