"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PlusCircle,
  Eye,
  Heart,
  MessageCircle,
  Users,
  TrendingUp,
  Calendar,
  BarChart3,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { formatDistanceToNow } from "date-fns";
import type { Id } from "@/convex/_generated/dataModel";
import DailyViewsChart from "@/components/daily-views-chat";

// Type definitions
type AnalyticsResponse = {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalFollowers: number;
  viewsGrowth: number;
  likesGrowth: number;
  commentsGrowth: number;
  followersGrowth: number;
};

type ActivityItem = {
  type: "like" | "comment" | "follow";
  user: string;
  post?: string;
  time: number;
};

type PostWithCommentCount = {
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
  commentCount: number;
};

type DailyViewData = {
  date: string;
  views: number;
  day: string;
  fullDate: string;
};

const convexApi = api as any;

export default function DashboardPage(): React.JSX.Element {
  // Fetch real data
  const { data: analytics, isLoading: analyticsLoading } = useConvexQuery<
    AnalyticsResponse | null | undefined
  >(convexApi.dashboard.getAnalytics);

  const { data: recentPosts, isLoading: postsLoading } = useConvexQuery<
    PostWithCommentCount[] | undefined
  >(convexApi.dashboard.getPostsWithAnalytics, { limit: 5 });

  const { data: recentActivity, isLoading: activityLoading } = useConvexQuery<
    ActivityItem[] | undefined
  >(convexApi.dashboard.getRecentActivity, { limit: 8 });

  const { data: dailyViewsData, isLoading: chartLoading } = useConvexQuery<
    DailyViewData[] | undefined
  >(convexApi.dashboard.getDailyViews);

  // Format time relative to now
  const formatTime = (timestamp: number): string => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  // Loading states
  if (analyticsLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#A1A1AA] mx-auto" />
          <p className="text-[#6B7280] mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Default values if no data
  const stats: AnalyticsResponse = analytics || {
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    totalFollowers: 0,
    viewsGrowth: 0,
    likesGrowth: 0,
    commentsGrowth: 0,
    followersGrowth: 0,
  };

  return (
    <div className="space-y-8 p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text-primary">
            Dashboard
          </h1>
          <p className="text-[#6B7280] mt-2">
            Welcome back! Here's what's happening with your content.
          </p>
        </div>

        <Link href="/dashboard/create">
          <Button variant={"primary"}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create New Post
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-[#6B7280]">
              Total Views
            </CardTitle>
            <Eye className="h-4 w-4 text-[#A1A1AA]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#EDEEF0]">
              {stats.totalViews.toLocaleString()}
            </div>
            {stats.viewsGrowth > 0 && (
              <div className="flex items-center text-xs text-[#A1A1AA] mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />+{stats.viewsGrowth}%
                from last month
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-[#6B7280]">
              Total Likes
            </CardTitle>
            <Heart className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#EDEEF0]">
              {stats.totalLikes.toLocaleString()}
            </div>
            {stats.likesGrowth > 0 && (
              <div className="flex items-center text-xs text-[#A1A1AA] mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />+{stats.likesGrowth}%
                from last month
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-[#6B7280]">
              Comments
            </CardTitle>
            <MessageCircle className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#EDEEF0]">
              {stats.totalComments.toLocaleString()}
            </div>
            {stats.commentsGrowth > 0 && (
              <div className="flex items-center text-xs text-[#A1A1AA] mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />+{stats.commentsGrowth}%
                from last month
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-[#6B7280]">
              Followers
            </CardTitle>
            <Users className="h-4 w-4 text-[#A1A1AA]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#EDEEF0]">
              {stats.totalFollowers.toLocaleString()}
            </div>
            {stats.followersGrowth > 0 && (
              <div className="flex items-center text-xs text-[#A1A1AA] mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />+{stats.followersGrowth}%
                from last month
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Posts */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="card-glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-[#EDEEF0]">Recent Posts</CardTitle>
                <Link href="/dashboard/posts">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#6B7280] hover:text-[#EDEEF0]"
                  >
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {postsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-[#A1A1AA]" />
                </div>
              ) : !recentPosts || recentPosts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[#6B7280] mb-4">No posts yet</p>
                  <Link href="/dashboard/create">
                    <Button variant="outline" size="sm">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Create Your First Post
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentPosts.map((post: PostWithCommentCount) => (
                    <div
                      key={post._id}
                      className="flex items-center justify-between p-4 bg-slate-800/30 hover:bg-slate-700/30 cursor-pointer rounded-lg transition-colors"
                      onClick={() =>
                        window.open(
                          `/dashboard/posts/edit/${post._id}`,
                          "_self"
                        )
                      }
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-[#EDEEF0] truncate">
                          {post.title || "Untitled Post"}
                        </h3>
                        <div className="flex items-center gap-4 mt-2">
                          <Badge
                            variant={
                              post.status === "published"
                                ? "default"
                                : post.scheduledFor &&
                                    post.scheduledFor > Date.now()
                                  ? "secondary"
                                  : "outline"
                            }
                            className={
                              post.status === "published"
                                ? "bg-zinc-800/50 text-[#A1A1AA] border-zinc-700"
                                : post.scheduledFor &&
                                    post.scheduledFor > Date.now()
                                  ? "bg-zinc-800/50 text-[#A1A1AA] border-zinc-700"
                                  : "bg-zinc-800/50 text-[#A1A1AA] border-zinc-700"
                            }
                          >
                            {post.scheduledFor && post.scheduledFor > Date.now()
                              ? "scheduled"
                              : post.status}
                          </Badge>
                          <span className="text-sm text-[#6B7280]">
                            {post.status === "published" && post.publishedAt
                              ? `Published ${formatTime(post.publishedAt)}`
                              : post.scheduledFor &&
                                  post.scheduledFor > Date.now()
                                ? `Scheduled for ${new Date(post.scheduledFor).toLocaleDateString()}`
                                : `Updated ${formatTime(post.updatedAt)}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-[#6B7280]">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {post.viewCount || 0}
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          {post.likeCount || 0}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          {post.commentCount || 0}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analytics Chart */}
          <Card className="card-glass">
            <CardHeader>
              <CardTitle className="text-[#EDEEF0] flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Analytics Overview
              </CardTitle>
              <CardDescription>Views over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <DailyViewsChart data={dailyViewsData} isLoading={chartLoading} />
            </CardContent>
          </Card>
        </div>

        {/* Activity Feed */}
        <div className="space-y-6">
          <Card className="card-glass">
            <CardHeader>
              <CardTitle className="text-white">Recent Activity</CardTitle>
              <CardDescription>
                Latest interactions with your content
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-[#A1A1AA]" />
                </div>
              ) : !recentActivity || recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[#6B7280]">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity: ActivityItem, index: number) => (
                    <div key={index} className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                          activity.type === "like"
                            ? "bg-red-500/20 text-red-300"
                            : activity.type === "comment"
                              ? "bg-zinc-800/50 text-[#A1A1AA]"
                              : "bg-zinc-800/50 text-[#A1A1AA]"
                        }`}
                      >
                        {activity.type === "like" && (
                          <Heart className="h-3 w-3" />
                        )}
                        {activity.type === "comment" && (
                          <MessageCircle className="h-3 w-3" />
                        )}
                        {activity.type === "follow" && (
                          <Users className="h-3 w-3" />
                        )}
                      </div>

                      <div className="flex-1">
                        <p className="text-sm text-[#EDEEF0]">
                          <span className="font-medium">{activity.user}</span>
                          {activity.type === "like" &&
                            ` liked your post "${activity.post}"`}
                          {activity.type === "comment" &&
                            ` commented on "${activity.post}"`}
                          {activity.type === "follow" &&
                            " started following you"}
                        </p>
                        <p className="text-xs text-[#6B7280] mt-1">
                          {formatTime(activity.time)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="card-glass">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/create">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-[#A1A1AA] hover:text-[#EDEEF0] hover:bg-zinc-800/50"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create New Post
                </Button>
              </Link>

              <Link href="/dashboard/posts">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-[#A1A1AA] hover:text-[#EDEEF0] hover:bg-zinc-800/50"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Manage Posts
                </Button>
              </Link>

              <Link href="/dashboard/followers">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-[#A1A1AA] hover:text-[#EDEEF0] hover:bg-zinc-800/50"
                >
                  <Users className="h-4 w-4 mr-2" />
                  View Followers
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}