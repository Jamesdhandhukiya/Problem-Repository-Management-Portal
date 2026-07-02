"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Code2, BookText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function NewQuestionDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleSelect = (type: "code" | "theory") => {
    setOpen(false);
    router.push(`/staff/questions/new?type=${type}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 h-4 w-4" />
        New Question
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Question Type</DialogTitle>
          <DialogDescription>
            Choose the template format for your new question.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4 sm:flex-row sm:justify-center">
          <Button
            variant="outline"
            className="flex-1 h-32 flex flex-col items-center justify-center gap-3 px-4 text-center whitespace-normal border-2 hover:border-primary hover:bg-primary/5 transition-all duration-200 ease-in-out"
            onClick={() => handleSelect("code")}
          >
            <Code2 className="h-10 w-10 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-sm font-semibold leading-snug">Algorithmic Problem Solving Challenges</span>
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-32 flex flex-col items-center justify-center gap-3 px-4 text-center whitespace-normal border-2 hover:border-primary hover:bg-primary/5 transition-all duration-200 ease-in-out"
            onClick={() => handleSelect("theory")}
          >
            <BookText className="h-10 w-10 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-sm font-semibold leading-snug">Project Definition / Idea / Prototype</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
