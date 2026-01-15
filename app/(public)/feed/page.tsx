"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useInView } from "react-intersection-observer";
import { TrendingUp, UserPlus, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useConvexQuery, useConvexMutation } from "@/hooks/use-convex-query";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import PostCard from "@/components/post-card";
import type { Post } from "@/components/post-card";
import type { Id } from "@/convex/_generated/dataModel";

// Type definitions
type TabType = "feed" | "trending";

type FeedResponse = {
  posts: Post[];
  hasMore: boolean;
  nextCursor?: Id<"posts"> | null;
};

type RecentPost = {
  _id: Id<"posts">;
  title: string;
  publishedAt?: number;
  viewCount: number;
  likeCount: number;
};

type SuggestedUser = {
  _id: Id<"users">;
  name: string;
  username?: string;
  imageUrl?: string;
  followerCount: number;
  postCount: number;
  recentPosts?: RecentPost[];
};

const convexApi = api as any;

export default function FeedPage(): React.JSX.Element {
  const { user: currentUser } = useUser();
  const [activeTab, setActiveTab] = useState<TabType>("feed");

  // Infinite scroll detection
  const { ref: loadMoreRef } = useInView({
    threshold: 0,
    rootMargin: "100px",
  });

  // Data queries
  const { data: feedData, isLoading: feedLoading } = useConvexQuery<
    FeedResponse | undefined
  >(convexApi.feed.getFeed, { limit: 15 });

  const { data: suggestedUsers, isLoading: suggestionsLoading } =
    useConvexQuery<SuggestedUser[] | undefined>(
      convexApi.feed.getSuggestedUsers,
      { limit: 6 }
    );

  const { data: trendingPosts, isLoading: trendingLoading } = useConvexQuery<
    Post[] | undefined
  >(convexApi.feed.getTrendingPosts, { limit: 15 });

  // Mutations
  const toggleFollow = useConvexMutation(convexApi.follows.toggleFollow);

  // Handle follow/unfollow
  const handleFollowToggle = async (userId: Id<"users">): Promise<void> => {
    if (!currentUser) {
      toast.error("Please sign in to follow users");
      return;
    }

    try {
      await toggleFollow.mutate({ followingId: userId });
      toast.success("Follow status updated");
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update follow status");
      }
    }
  };

  // Get current posts based on active tab
  const getCurrentPosts = (): Post[] => {
    switch (activeTab) {
      case "trending":
        return trendingPosts || [];
      default:
        return feedData?.posts || [];
    }
  };

  const currentPosts: Post[] = getCurrentPosts();

  const isLoading: boolean =
    feedLoading || (activeTab === "trending" && trendingLoading);
  
  return (
    <div className="min-h-screen text-[#A1A1AA] pt-32 pb-12 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Feed Header */}
        <div className="text-center mb-12">
          <h1 
            className="text-5xl md:text-6xl font-bold pb-3 tracking-tight"
            style={{
              background: "linear-gradient(90deg, #F9FAFB, #E5E7EB, #9CA3AF, #F3F4F6)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            } as React.CSSProperties}
          >
            Discover Amazing Content
          </h1>
          <p className="text-[#9CA3AF] text-lg leading-relaxed mt-2">
            Stay up to date with the latest posts from creators you follow
          </p>
        </div>

        {/* Main Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
          <div className="lg:col-span-4 space-y-6">
            {/* Feed Tabs */}
            <div className="flex space-x-3 p-1 bg-[#0B0D10] rounded-xl border border-[#1F2228]">
              <button
                onClick={() => setActiveTab("feed")}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === "feed"
                    ? "bg-gradient-to-b from-[#F9FAFB] to-[#D4D4D8] text-[#0B0D10] shadow-sm"
                    : "text-[#9CA3AF] hover:text-[#D1D5DB] hover:bg-[#111318]/50"
                }`}
              >
                For You
              </button>
              <button
                onClick={() => setActiveTab("trending")}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center ${
                  activeTab === "trending"
                    ? "bg-gradient-to-b from-[#F9FAFB] to-[#D4D4D8] text-[#0B0D10] shadow-sm"
                    : "text-[#9CA3AF] hover:text-[#D1D5DB] hover:bg-[#111318]/50"
                }`}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Trending
              </button>
            </div>

            {/* Create Post Prompt */}
            {currentUser && (
              <Link
                href="/dashboard/create"
                className="flex items-center space-x-3 cursor-pointer group"
              >
                <div className="relative w-10 h-10 flex-shrink-0">
                  {currentUser.imageUrl ? (
                    <Image
                      src={currentUser.imageUrl}
                      alt={currentUser.firstName || "User"}
                      fill
                      className="rounded-full object-cover"
                      sizes="40px"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-[#9CA3AF] to-[#6B7280] flex items-center justify-center text-sm font-bold text-[#0B0D10]">
                      {(currentUser.firstName || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="bg-[#111318] border border-[#1F2228] rounded-xl px-4 py-3 text-[#6B7280] hover:border-[#E5E7EB]/20 hover:bg-[#16181D] focus-within:border-[#E5E7EB]/30 focus-within:bg-[#16181D] transition-all duration-200 group-hover:shadow-sm">
                    Share an idea, thought, or update…
                  </div>
                </div>
              </Link>
            )}

            {/* Posts Feed */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#9CA3AF] mx-auto mb-4" />
                    <p className="text-[#9CA3AF]">Loading posts...</p>
                  </div>
              </div>
            ) : currentPosts.length === 0 ? (
              <Card className="card-glass">
                <CardContent className="text-center py-16 px-6">
                  <div className="space-y-5">
                    <div className="flex justify-center">
                      <div className="w-16 h-16 rounded-full bg-[#111318] border border-[#1F2228] flex items-center justify-center">
                        <Sparkles className="h-8 w-8 text-[#9CA3AF]" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-[#EDEEF0] mb-3">
                        {activeTab === "trending"
                          ? "No trending posts right now"
                          : "No posts to show"}
                      </h3>
                      <p className="text-[#9CA3AF] text-base leading-relaxed max-w-md mx-auto">
                        {activeTab === "trending"
                          ? "Check back later for trending content"
                          : "Your feed is empty for now — follow creators to see ideas appear here."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Posts Grid */}
                <div className="space-y-6">
                  {currentPosts.map((post: Post) => (
                    <div 
                      key={post._id}
                      className="transition-all duration-200 hover:-translate-y-0.5"
                    >
                      <PostCard
                        post={post}
                        showActions={false}
                        showAuthor={true}
                        className="max-w-none"
                      />
                    </div>
                  ))}
                </div>

                {/* Load More Indicator */}
                {activeTab === "feed" && feedData?.hasMore && (
                  <div ref={loadMoreRef} className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[#9CA3AF]" />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Left Sidebar - Following */}
          <div className="lg:col-span-2 space-y-6 mt-14">
            {/* Suggested Users */}
            <Card className="card-glass">
              <CardHeader>
                <CardTitle className="text-[#EDEEF0] flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-[#9CA3AF]" />
                  Suggested Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                {suggestionsLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-[#9CA3AF]" />
                  </div>
                ) : !suggestedUsers || suggestedUsers.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-[#6B7280] text-sm">
                      No suggestions available
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {suggestedUsers.map((user: SuggestedUser) => (
                      <div key={user._id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Link href={`/${user.username || ""}`}>
                            <div className="flex items-center space-x-3 cursor-pointer">
                              <div className="relative w-10 h-10">
                                {user.imageUrl ? (
                                  <Image
                                    src={user.imageUrl}
                                    alt={user.name}
                                    fill
                                    className="rounded-full object-cover"
                                    sizes="40px"
                                  />
                                ) : (
                                  <div className="w-full h-full rounded-full bg-gradient-to-br from-[#9CA3AF] to-[#6B7280] flex items-center justify-center text-sm font-bold text-[#0B0D10]">
                                    {user.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-[#EDEEF0]">
                                  {user.name}
                                </p>
                                {user.username && (
                                  <p className="text-xs text-[#6B7280]">
                                    @{user.username}
                                  </p>
                                )}
                              </div>
                            </div>
                          </Link>
                          <Button
                            onClick={() => handleFollowToggle(user._id)}
                            variant="outline"
                            size="sm"
                            className="border-[#1F2228] text-[#A1A1AA] hover:bg-[#16181D] hover:text-[#EDEEF0] hover:border-[#1F2228]"
                          >
                            <UserPlus className="h-3 w-3 mr-1" />
                            Follow
                          </Button>
                        </div>
                        <div className="text-xs text-[#6B7280] pl-13">
                          {user.followerCount} followers • {user.postCount}{" "}
                          posts
                        </div>
                        {user.recentPosts && user.recentPosts.length > 0 && (
                          <div className="text-xs text-[#9CA3AF] pl-13">
                            Latest: "
                            {user.recentPosts[0].title.substring(0, 30)}..."
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}