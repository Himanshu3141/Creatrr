"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { type UseFormReturn } from "react-hook-form";
import { z } from "zod";

const postSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  content: z.string().min(1, "Content is required"),
  category: z.string().optional(),
  tags: z.array(z.string()).max(10, "Maximum 10 tags allowed"),
  featuredImage: z.string().optional(),
  scheduledFor: z.string().optional(),
});

type PostFormData = z.infer<typeof postSchema>;

interface PostEditorSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  form: UseFormReturn<PostFormData>;
  mode: "create" | "edit";
}

const CATEGORIES = [
  "Technology",
  "Design",
  "Marketing",
  "Business",
  "Lifestyle",
  "Education",
  "Health",
  "Travel",
  "Food",
  "Entertainment",
] as const;

export default function PostEditorSettings({
  isOpen,
  onClose,
  form,
  mode,
}: PostEditorSettingsProps) {
  
  const [tagInput, setTagInput] = useState<string>("");
  const { watch, setValue } = form;
  const watchedValues = watch();

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (
      tag &&
      !watchedValues.tags.includes(tag) &&
      watchedValues.tags.length < 10
    ) {
      setValue("tags", [...watchedValues.tags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setValue(
      "tags",
      watchedValues.tags.filter((tag) => tag !== tagToRemove)
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Post Settings</DialogTitle>
          <DialogDescription>Configure your post details</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Category */}
          <div className="space-y-2">
            <label className="text-white text-sm font-medium">Category</label>
            <Select
              value={watchedValues.category}
              onValueChange={(value) => setValue("category", value)}
            >
              <SelectTrigger className="bg-slate-800 border-slate-600">
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <label className="text-white text-sm font-medium">Tags</label>
            <div className="flex space-x-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInput}
                placeholder="Add tags..."
                className="bg-slate-800 border-slate-600"
              />
              <Button
                type="button"
                onClick={addTag}
                variant="outline"
                size="sm"
                className="border-slate-600"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {watchedValues.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {watchedValues.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-zinc-800/50 text-[#A1A1AA] border-zinc-700"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-red-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <p className="text-xs text-slate-400">
              {watchedValues.tags.length}/10 tags • Press Enter or comma to add
            </p>
          </div>

          {/* Scheduling */}
          {mode === "create" && (
            <div className="space-y-2">
              <label className="text-white text-sm font-medium">
                Schedule Publication
              </label>
              <Input
                value={watchedValues.scheduledFor}
                onChange={(e) => setValue("scheduledFor", e.target.value)}
                type="datetime-local"
                className="bg-slate-800 border-slate-600"
                min={new Date().toISOString().slice(0, 16)}
              />
              <p className="text-xs text-slate-400">
                Leave empty to publish immediately
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}