"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageIcon, Sparkles, Wand2, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { generateBlogContent, improveContent } from "@/app/actions/gemini";
import { BarLoader } from "react-spinners";
import { type UseFormReturn } from "react-hook-form";
import { z } from "zod";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const postSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  content: z.string().min(1, "Content is required"),
  category: z.string().optional(),
  tags: z.array(z.string()).max(10, "Maximum 10 tags allowed"),
  featuredImage: z.string().optional(),
  scheduledFor: z.string().optional(),
});

type PostFormData = z.infer<typeof postSchema>;

type QuillInstance = {
  getEditor: () => {
    getSelection: () => { index: number } | null;
    getLength: () => number;
    insertEmbed: (index: number, type: string, url: string) => void;
    setSelection: (index: number) => void;
  };
};

interface PostEditorContentProps {
  form: UseFormReturn<PostFormData>;
  setQuillRef: (ref: QuillInstance | null) => void;
  onImageUpload: (type: "featured" | "content") => void;
}

const quillConfig = {
  modules: {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        [{ size: ["small", false, "large", "huge"] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        ["link", "blockquote", "code-block"],
        [
          { list: "ordered" },
          { list: "bullet" },
          { indent: "-1" },
          { indent: "+1" },
        ],
        ["image", "video"],
      ],
      handlers: { image: function () {} },
    },
  },
  formats: [
    "header",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "align",
    "link",
    "blockquote",
    "code-block",
    "list",
    "indent",
    "image",
    "video",
  ],
};

export default function PostEditorContent({
  form,
  setQuillRef,
  onImageUpload,
}: PostEditorContentProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const watchedValues = watch();
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isImproving, setIsImproving] = useState<boolean>(false);
  const quillRef = useRef<QuillInstance | null>(null);

  const getQuillModules = () => ({
    ...quillConfig.modules,
    toolbar: {
      ...quillConfig.modules.toolbar,
      handlers: { image: () => onImageUpload("content") },
    },
  });

  // Import CSS dynamically on client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      // @ts-ignore - CSS file doesn't have TypeScript declarations
      import("react-quill-new/dist/quill.snow.css");
    }
  }, []);

  useEffect(() => {
    if (quillRef.current) {
      setQuillRef(quillRef.current);
    }
    return () => {
      setQuillRef(null);
    };
  }, [setQuillRef]);

  const handleAI = async (
    type: "generate" | "improve",
    improvementType: "enhance" | "expand" | "simplify" | null = null
  ) => {
    const { title, content, category, tags } = watchedValues;

    if (type === "generate") {
      if (!title?.trim())
        return toast.error("Please add a title before generating content");
      if (
        content &&
        content !== "<p><br></p>" &&
        !window.confirm("This will replace your existing content. Continue?")
      )
        return;
      setIsGenerating(true);
    } else {
      if (!content || content === "<p><br></p>")
        return toast.error("Please add some content before improving it");
      setIsImproving(true);
    }

    try {
      const result =
        type === "generate"
          ? await generateBlogContent(title || "", category || "", tags || [])
          : await improveContent(
              content || "",
              improvementType || "enhance"
            );

      if (result.success) {
        setValue("content", result.content);
        toast.success(
          `Content ${type === "generate" ? "generated" : improvementType + "d"} successfully!`
        );
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error(`Failed to ${type} content. Please try again.`);
    } finally {
      type === "generate" ? setIsGenerating(false) : setIsImproving(false);
    }
  };

  const hasTitle = watchedValues.title?.trim();
  const hasContent =
    watchedValues.content && watchedValues.content !== "<p><br></p>";

  return (
    <>
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-8">
          {/* Featured Image */}
          {watchedValues.featuredImage ? (
            <div className="relative group">
              <img
                src={watchedValues.featuredImage}
                alt="Featured"
                className="w-full h-80 object-cover rounded-xl"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center space-x-3">
                <Button
                  onClick={() => onImageUpload("featured")}
                  variant="secondary"
                  size="sm"
                >
                  Change Image
                </Button>
                <Button
                  onClick={() => setValue("featuredImage", "")}
                  variant="outline"
                  size="sm"
                >
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => onImageUpload("featured")}
              className="w-full h-36 border border-[#1F2228] rounded-xl flex flex-col items-center justify-center space-y-4 hover:border-[#E5E7EB]/20 hover:bg-[#111318]/50 transition-all duration-200 group"
            >
              <ImageIcon className="h-10 w-10 text-[#9CA3AF] group-hover:text-[#D1D5DB] transition-colors" />
              <div className="text-center">
                <p className="text-[#A1A1AA] text-base font-medium">
                  Add a featured image
                </p>
                <p className="text-[#6B7280] text-sm mt-1">
                  Optional • Upload and transform with AI
                </p>
              </div>
            </button>
          )}

          {/* Title */}
          <div className="space-y-3">
            <div className="relative">
              <Input
                {...register("title")}
                placeholder="Give your story a powerful title…"
                className={`border-0 text-5xl font-bold bg-transparent placeholder:text-[#6B7280] p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 pb-3 border-b border-[#1F2228] focus:border-[#E5E7EB]/20 transition-all duration-200 ${
                  watchedValues.title ? "title-metallic" : "text-[#EDEEF0]"
                }`}
                style={{ 
                  fontSize: "3rem", 
                  lineHeight: "1.2",
                }}
              />
            </div>
            {errors.title && (
              <p className="text-[#9CA3AF] mt-2 text-sm">{errors.title.message}</p>
            )}
          </div>

          {/* AI Tools */}
          <div>
            {hasContent && (
              <div className="grid grid-cols-3 w-full gap-3">
                {(
                  [
                    { type: "enhance" as const, icon: Sparkles, label: "Enhance" },
                    { type: "expand" as const, icon: Plus, label: "Expand" },
                    { type: "simplify" as const, icon: Minus, label: "Simplify" },
                  ] as const
                ).map(({ type, icon: Icon, label }) => (
                  <Button
                    key={type}
                    onClick={() => handleAI("improve", type)}
                    disabled={isGenerating || isImproving}
                    variant="primary"
                    size="sm"
                    className="transition-all duration-200"
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {label}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {(isGenerating || isImproving) && (
            <BarLoader width={"95%"} color="#9CA3AF" />
          )}

          {/* Editor */}
          <div className="prose prose-lg max-w-none bg-[#111318] rounded-xl p-6 border border-[#1F2228] relative">
            <ReactQuill
              // @ts-expect-error - react-quill-new types don't properly support ref
              ref={quillRef}
              theme="snow"
              value={watchedValues.content || ""}
              onChange={(content: string) => setValue("content", content)}
              readOnly={false}
              modules={getQuillModules()}
              formats={quillConfig.formats}
              placeholder="Start writing… or let AI help you shape your thoughts."
              style={{
                minHeight: "400px",
                fontSize: "1.125rem",
                lineHeight: "1.7",
              }}
            />
            {errors.content && (
              <p className="text-[#9CA3AF] mt-2 text-sm">{errors.content.message}</p>
            )}
          </div>
        </div>
      </main>

      <style jsx global>{`
        .title-metallic {
          background: linear-gradient(90deg, #F9FAFB, #E5E7EB, #9CA3AF, #F3F4F6) !important;
          -webkit-background-clip: text !important;
          background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          text-fill-color: transparent !important;
        }
        .ql-container {
          border: 1px solid #1F2228 !important;
          border-top: none !important;
          border-radius: 0 0 8px 8px !important;
          background: #16181D !important;
        }
        .ql-editor {
          color: #A1A1AA !important;
          font-size: 1.125rem !important;
          line-height: 1.7 !important;
          padding: 1.5rem !important;
          min-height: 400px !important;
        }
        .ql-editor::before {
          color: #6B7280 !important;
          font-style: italic !important;
          font-weight: 300 !important;
        }
        .ql-editor .ql-cursor {
          border-left: 2px solid #E5E7EB !important;
        }
        .ql-toolbar {
          border: 1px solid #1F2228 !important;
          padding: 0.75rem 1rem !important;
          position: sticky !important;
          top: 80px !important;
          background: #111318 !important;
          z-index: 30 !important;
          border-radius: 8px 8px 0 0 !important;
          margin-bottom: 0 !important;
          display: flex !important;
          gap: 0.5rem !important;
        }
        .ql-toolbar.ql-disabled {
          opacity: 0.4 !important;
          pointer-events: none !important;
        }
        .ql-snow .ql-tooltip {
          background: #111318 !important;
          border: 1px solid #1F2228 !important;
          color: #EDEEF0 !important;
        }
        .ql-snow .ql-picker {
          color: #9CA3AF !important;
        }
        .ql-snow .ql-picker-options {
          background: #111318 !important;
          border: 1px solid #1F2228 !important;
        }
        .ql-snow .ql-fill,
        .ql-snow .ql-stroke.ql-fill {
          fill: #9CA3AF !important;
        }
        .ql-snow .ql-stroke {
          stroke: #9CA3AF !important;
        }
        .ql-snow .ql-picker-label:hover,
        .ql-snow button:hover,
        .ql-snow button.ql-active {
          color: #E5E7EB !important;
        }
        .ql-snow .ql-picker-label:hover .ql-stroke,
        .ql-snow button:hover .ql-stroke,
        .ql-snow button.ql-active .ql-stroke {
          stroke: #E5E7EB !important;
        }
        .ql-editor h2 {
          font-size: 2rem !important;
          font-weight: 600 !important;
          color: #D1D5DB !important;
        }
        .ql-editor h3 {
          font-size: 1.5rem !important;
          font-weight: 600 !important;
          color: #D1D5DB !important;
        }
        .ql-editor blockquote {
          border-left: 4px solid #6B7280 !important;
          color: #A1A1AA !important;
          padding-left: 1rem !important;
          font-style: italic !important;
        }
        .ql-editor a {
          color: #D1D5DB !important;
        }
        .ql-editor code {
          background: #111318 !important;
          color: #A1A1AA !important;
          padding: 0.125rem 0.25rem !important;
          border-radius: 0.25rem !important;
          border: 1px solid #1F2228 !important;
        }
      `}</style>
    </>
  );
}