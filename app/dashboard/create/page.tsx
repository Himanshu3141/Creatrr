"use client";

import React from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import PostEditor from "@/components/post-editor";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { type Id } from "@/convex/_generated/dataModel";

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

type UserData = {
  _id: Id<"users">;
  _creationTime: number;
  name: string;
  email: string;
  tokenIdentifier: string;
  imageUrl?: string;
  username?: string;
  createdAt: number;
  lastActiveAt: number;
};

export default function CreatePostPage() {
  // Get existing draft
  const { data: existingDraft, isLoading: isDraftLoading } =
    useConvexQuery<PostData | null>(api.posts.getUserDraft);

  const { data: currentUser, isLoading: userLoading } =
    useConvexQuery<UserData>(api.users.getCurrentUser);

  if (isDraftLoading || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
          <span className="text-slate-300">Loading...</span>
        </div>
      </div>
    );
  }

  if (!currentUser?.username) {
    return (
      <div className="h-80 bg-[#111318] flex items-center justify-center p-8">
        <div className="max-w-2xl w-full text-center space-y-6">
          <h1 className="text-3xl font-bold text-white">Username Required</h1>
          <p className="text-slate-400 text-lg">
            Set up a username to create and share your posts
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/dashboard/settings">
              <Button variant="primary">
                Set Up Username
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <PostEditor initialData={existingDraft} mode="create" />;
}