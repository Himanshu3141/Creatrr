import { v } from "convex/values";
import { query } from "./_generated/server";
import type { Id, Doc } from "./_generated/dataModel";

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

type GetRecentActivityArgs = {
  limit?: number;
};

type PostWithCommentCount = Doc<"posts"> & {
  commentCount: number;
};

type GetPostsWithAnalyticsArgs = {
  limit?: number;
};

type DailyViewData = {
  date: string;
  views: number;
  day: string;
  fullDate: string;
};

type ViewsByDate = {
  [key: string]: number;
};

// Get dashboard analytics for the authenticated user
export const getAnalytics = query({
  handler: async (ctx): Promise<AnalyticsResponse | null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Get user from database
    const user: Doc<"users"> | null = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .unique();

    if (!user) {
      return null;
    }

    // Get all user's posts
    const posts: Doc<"posts">[] = await ctx.db
      .query("posts")
      .filter((q) => q.eq(q.field("authorId"), user._id))
      .collect();

    // Get user's followers count
    const followersCount: Doc<"follows">[] = await ctx.db
      .query("follows")
      .filter((q) => q.eq(q.field("followingId"), user._id))
      .collect();

    // Calculate analytics
    const totalViews: number = posts.reduce(
      (sum: number, post: Doc<"posts">) => sum + post.viewCount,
      0
    );
    const totalLikes: number = posts.reduce(
      (sum: number, post: Doc<"posts">) => sum + post.likeCount,
      0
    );

    // Get comments count for user's posts
    const postIds: Id<"posts">[] = posts.map((p: Doc<"posts">) => p._id);
    let totalComments: number = 0;

    for (const postId of postIds) {
      const comments: Doc<"comments">[] = await ctx.db
        .query("comments")
        .filter((q) =>
          q.and(
            q.eq(q.field("postId"), postId),
            q.eq(q.field("status"), "approved")
          )
        )
        .collect();
      totalComments += comments.length;
    }

    // Calculate growth percentages (simplified - you might want to implement proper date-based calculations)
    const thirtyDaysAgo: number = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const recentPosts: Doc<"posts">[] = posts.filter(
      (p: Doc<"posts">) => p.createdAt > thirtyDaysAgo
    );
    const recentViews: number = recentPosts.reduce(
      (sum: number, post: Doc<"posts">) => sum + post.viewCount,
      0
    );
    const recentLikes: number = recentPosts.reduce(
      (sum: number, post: Doc<"posts">) => sum + post.likeCount,
      0
    );

    // Simple growth calculation (you can enhance this)
    const viewsGrowth: number =
      totalViews > 0 ? (recentViews / totalViews) * 100 : 0;
    const likesGrowth: number =
      totalLikes > 0 ? (recentLikes / totalLikes) * 100 : 0;
    const commentsGrowth: number = totalComments > 0 ? 15 : 0; // Placeholder
    const followersGrowth: number = followersCount.length > 0 ? 12 : 0; // Placeholder

    return {
      totalViews,
      totalLikes,
      totalComments,
      totalFollowers: followersCount.length,
      viewsGrowth: Math.round(viewsGrowth * 10) / 10,
      likesGrowth: Math.round(likesGrowth * 10) / 10,
      commentsGrowth,
      followersGrowth,
    };
  },
});

// Get recent activity for the dashboard
export const getRecentActivity = query({
  args: { limit: v.optional(v.number()) },
  handler: async (
    ctx,
    args: GetRecentActivityArgs
  ): Promise<ActivityItem[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Get user from database
    const user: Doc<"users"> | null = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .unique();

    if (!user) {
      return [];
    }

    // Get user's posts
    const posts: Doc<"posts">[] = await ctx.db
      .query("posts")
      .filter((q) => q.eq(q.field("authorId"), user._id))
      .collect();

    const postIds: Id<"posts">[] = posts.map((p: Doc<"posts">) => p._id);
    const activities: ActivityItem[] = [];

    // Get recent likes on user's posts
    for (const postId of postIds) {
      const likes: Doc<"likes">[] = await ctx.db
        .query("likes")
        .filter((q) => q.eq(q.field("postId"), postId))
        .order("desc")
        .take(5);

      for (const like of likes) {
        if (like.userId) {
          const likeUser: Doc<"users"> | null = await ctx.db.get(like.userId);
          const post: Doc<"posts"> | undefined = posts.find(
            (p: Doc<"posts">) => p._id === postId
          );

          if (likeUser && post) {
            activities.push({
              type: "like" as const,
              user: likeUser.name,
              post: post.title,
              time: like.createdAt,
            });
          }
        }
      }
    }

    // Get recent comments on user's posts
    for (const postId of postIds) {
      const comments: Doc<"comments">[] = await ctx.db
        .query("comments")
        .filter((q) =>
          q.and(
            q.eq(q.field("postId"), postId),
            q.eq(q.field("status"), "approved")
          )
        )
        .order("desc")
        .take(5);

      for (const comment of comments) {
        const post: Doc<"posts"> | undefined = posts.find(
          (p: Doc<"posts">) => p._id === postId
        );

        if (post) {
          activities.push({
            type: "comment" as const,
            user: comment.authorName,
            post: post.title,
            time: comment.createdAt,
          });
        }
      }
    }

    // Get recent followers
    const recentFollowers: Doc<"follows">[] = await ctx.db
      .query("follows")
      .filter((q) => q.eq(q.field("followingId"), user._id))
      .order("desc")
      .take(5);

    for (const follow of recentFollowers) {
      const follower: Doc<"users"> | null = await ctx.db.get(
        follow.followerId
      );
      if (follower) {
        activities.push({
          type: "follow" as const,
          user: follower.name,
          time: follow.createdAt,
        });
      }
    }

    // Sort all activities by time and limit
    activities.sort((a: ActivityItem, b: ActivityItem) => b.time - a.time);

    return activities.slice(0, args.limit || 10);
  },
});

// Get posts with analytics for dashboard
export const getPostsWithAnalytics = query({
  args: { limit: v.optional(v.number()) },
  handler: async (
    ctx,
    args: GetPostsWithAnalyticsArgs
  ): Promise<PostWithCommentCount[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Get user from database
    const user: Doc<"users"> | null = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .unique();

    if (!user) {
      return [];
    }

    // Get recent posts with enhanced data
    const posts: Doc<"posts">[] = await ctx.db
      .query("posts")
      .filter((q) => q.eq(q.field("authorId"), user._id))
      .order("desc")
      .take(args.limit || 5);

    // Add comment counts to each post
    const postsWithComments: PostWithCommentCount[] = await Promise.all(
      posts.map(async (post: Doc<"posts">): Promise<PostWithCommentCount> => {
        const comments: Doc<"comments">[] = await ctx.db
          .query("comments")
          .filter((q) =>
            q.and(
              q.eq(q.field("postId"), post._id),
              q.eq(q.field("status"), "approved")
            )
          )
          .collect();

        return {
          ...post,
          commentCount: comments.length,
        };
      })
    );

    return postsWithComments;
  },
});

// Get daily views data for chart (last 30 days) - Assignment
export const getDailyViews = query({
  handler: async (ctx): Promise<DailyViewData[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get current user
    const user: Doc<"users"> | null = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Get user's posts
    const userPosts: Doc<"posts">[] = await ctx.db
      .query("posts")
      .filter((q) => q.eq(q.field("authorId"), user._id))
      .collect();

    const postIds: Id<"posts">[] = userPosts.map(
      (post: Doc<"posts">) => post._id
    );

    // Generate last 30 days
    const days: DailyViewData[] = [];
    for (let i = 29; i >= 0; i--) {
      const date: Date = new Date();
      date.setDate(date.getDate() - i);
      const dateString: string = date.toISOString().split("T")[0]; // YYYY-MM-DD
      days.push({
        date: dateString,
        views: 0,
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        fullDate: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      });
    }

    // Get daily stats for all user's posts
    const dailyStats: Doc<"dailyStats">[] = await ctx.db
      .query("dailyStats")
      .filter((q) =>
        q.or(...postIds.map((id: Id<"posts">) => q.eq(q.field("postId"), id)))
      )
      .collect();

    // Aggregate views by date
    const viewsByDate: ViewsByDate = {};
    dailyStats.forEach((stat: Doc<"dailyStats">) => {
      if (viewsByDate[stat.date]) {
        viewsByDate[stat.date] += stat.views;
      } else {
        viewsByDate[stat.date] = stat.views;
      }
    });

    // Merge with days array
    const chartData: DailyViewData[] = days.map((day: DailyViewData) => ({
      ...day,
      views: viewsByDate[day.date] || 0,
    }));

    return chartData;
  },
});