"use client";

import React, { useState, useEffect, useCallback, type RefObject } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { useConvexMutation } from "@/hooks/use-convex-query";
import { type Id } from "@/convex/_generated/dataModel";
import PostEditorHeader from "./post-editor-header";
import PostEditorContent from "./post-editor-content";
import PostEditorSettings from "./post-editor-settings";
import ImageUploadModal from "./image-upload-modal";

const postSchema = z.object({ 
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  content: z.string().min(1, "Content is required"),
  category: z.string().optional(),
  tags: z.array(z.string()).max(10, "Maximum 10 tags allowed"),
  featuredImage: z.string().optional(),
  scheduledFor: z.string().optional(),
});

type PostFormData = z.infer<typeof postSchema>;

type PostData = {
  _id: Id<"posts">;
  _creationTime: number;
  title: string;
  content: string;
  status: "draft" | "published";
  authorId: Id<"users">;
  tags: string[];
  category?: string;
  featuredImage?: string;
  createdAt: number;
  updatedAt: number;
  publishedAt?: number;
  scheduledFor?: number;
  viewCount: number;
  likeCount: number;
};

interface PostEditorProps {
  initialData?: PostData | null;
  mode?: "create" | "edit";
}

interface ImageData {
  url: string;
}

type QuillInstance = {
  getEditor: () => {
    getSelection: () => { index: number } | null;
    getLength: () => number;
    insertEmbed: (index: number, type: string, url: string) => void;
    setSelection: (index: number) => void;
  };
};

export default function PostEditor({
  initialData = null,
  mode = "create",
}: PostEditorProps) {
  
  const router = useRouter();
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);
  const [imageModalType, setImageModalType] = useState<"featured" | "content">(
    "featured"
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [quillRef, setQuillRef] = useState<QuillInstance | null>(null);

  // Mutations with built-in loading states
  const { mutate: createPost, isLoading: isCreateLoading } =
    useConvexMutation<Id<"posts">>(api.posts.create);
  const { mutate: updatePost, isLoading: isUpdating } =
    useConvexMutation<Id<"posts">>(api.posts.update);

  // Form setup
  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: initialData?.title || "",
      content: initialData?.content || "",
      category: initialData?.category || "",
      tags: initialData?.tags || [],
      featuredImage: initialData?.featuredImage || "",
      scheduledFor: initialData?.scheduledFor
        ? new Date(initialData.scheduledFor).toISOString().slice(0, 16)
        : "",
    },
  });

  const { handleSubmit, watch, setValue } = form;
  const watchedValues = watch();

  // Submit handler
  const onSubmit = useCallback(
    async (
      data: PostFormData,
      action: "publish" | "draft" | "schedule",
      silent = false
    ): Promise<Id<"posts"> | undefined> => {
      try {
        // Validate title is required for all actions
        if (!data.title || data.title.trim().length === 0) {
          if (!silent) {
            toast.error("Title is required to save or publish a post");
          }
          throw new Error("Title is required");
        }

        // For publishing, ensure content exists
        if ((action === "publish" || action === "schedule") && (!data.content || data.content.trim() === "" || data.content === "<p><br></p>")) {
          if (!silent) {
            toast.error("Content is required to publish a post");
          }
          throw new Error("Content is required to publish");
        }

        const postData = {
          title: data.title.trim(),
          content: data.content,
          category: data.category || undefined,
          tags: data.tags,
          featuredImage: data.featuredImage || undefined,
          status: action === "publish" ? "published" : "draft",
          scheduledFor: data.scheduledFor
            ? new Date(data.scheduledFor).getTime()
            : undefined,
        };

        let resultId;

        if (mode === "edit" && initialData?._id) {
          // Always use update for edit mode
          resultId = await updatePost({
            id: initialData._id,
            ...postData,
          });
        } else if (initialData?._id && action === "draft") {
          // If we have existing draft data, update it
          resultId = await updatePost({
            id: initialData._id,
            ...postData,
          });
        } else {
          // Create new post (will auto-update existing draft if needed)
          resultId = await createPost(postData);
        }

        if (!silent) {
          const message =
            action === "publish" ? "Post published!" : "Draft saved!";
          toast.success(message);
          if (action === "publish") router.push("/dashboard/posts");
        }

        return resultId;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to save post";
        if (!silent) toast.error(errorMessage);
        throw error;
      }
    },
    [mode, initialData, updatePost, createPost, router]
  );

  const handleSave = useCallback(
    (silent = false) => {
      handleSubmit((data) => onSubmit(data, "draft", silent))();
    },
    [handleSubmit, onSubmit]
  );

  // Auto-save for drafts
  useEffect(() => {
    if (!watchedValues.title && !watchedValues.content) return;

    const autoSave = setInterval(() => {
      if (watchedValues.title || watchedValues.content) {
        if (mode === "create") handleSave(true); // Silent save
      }
    }, 30000);

    return () => clearInterval(autoSave);
  }, [watchedValues.title, watchedValues.content, mode, handleSave]);

 
  const handlePublish = () => {
    handleSubmit((data) => onSubmit(data, "publish"))();
  };

  const handleSchedule = () => {
    if (!watchedValues.scheduledFor) {
      toast.error("Please select a date and time to schedule");
      return;
    }
    handleSubmit((data) => onSubmit(data, "schedule"))();
  };

   // Handle image selection
   const handleImageSelect = (imageData: ImageData) => {
    if (imageModalType === "featured") {
      setValue("featuredImage", imageData.url);
      toast.success("Featured image added!");
    } else if (imageModalType === "content" && quillRef) {
      const quill = quillRef.getEditor();
      const range = quill.getSelection();
      const index = range ? range.index : quill.getLength();

      quill.insertEmbed(index, "image", imageData.url);
      quill.setSelection(index + 1);
      toast.success("Image inserted!");
    }
    setIsImageModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <PostEditorHeader
        mode={mode}
        initialData={initialData}
        isPublishing={isCreateLoading || isUpdating}
        hasTitle={!!watchedValues.title?.trim()}
        onSave={handleSave}
        onPublish={handlePublish}
        onSchedule={handleSchedule}
        onSettingsOpen={() => setIsSettingsOpen(true)}
        onBack={() => router.push("/dashboard")}
      />

      <PostEditorContent
        form={form}
        setQuillRef={setQuillRef}
        onImageUpload={(type: "featured" | "content") => {
          setImageModalType(type);
          setIsImageModalOpen(true);
        }}
      />

      <PostEditorSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        form={form}
        mode={mode}
      />

      <ImageUploadModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        onImageSelect={handleImageSelect}
        title={
          imageModalType === "featured"
            ? "Upload Featured Image"
            : "Insert Image"
        }
      />
    </div>
  );
}