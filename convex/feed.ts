import { v } from "convex/values";
import { query } from "./_generated/server";
import type { Id, Doc } from "./_generated/dataModel";

// Type definitions
type AuthorInfo = {
  _id: Id<"users">;
  name: string;
  username?: string;
  imageUrl?: string;
};

type PostWithAuthor = Doc<"posts"> & {
  author: AuthorInfo | null;
};

type FeedResponse = {
  posts: PostWithAuthor[];
  hasMore: boolean;
};

type GetFeedArgs = {
  limit?: number;
};

type RecentPost = {
  _id: Id<"posts">;
  title: string;
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
  engagementScore: number;
  lastPostAt: number | null;
  recentPosts: RecentPost[];
};

type GetSuggestedUsersArgs = {
  limit?: number;
};

type TrendingPost = Doc<"posts"> & {
  trendingScore: number;
  author: AuthorInfo | null;
};

type GetTrendingPostsArgs = {
  limit?: number;
};

// Get feed posts - can improve it to show following posts first
export const getFeed = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args: GetFeedArgs): Promise<FeedResponse> => {
    const limit: number = args.limit || 10;

    const allPosts: Doc<"posts">[] = await ctx.db
      .query("posts")
      .filter((q) => q.eq(q.field("status"), "published"))
      .order("desc")
      .take(limit + 1);

    const hasMore: boolean = allPosts.length > limit;
    const feedPosts: Doc<"posts">[] = hasMore
      ? allPosts.slice(0, limit)
      : allPosts;

    const postsWithAuthors: PostWithAuthor[] = await Promise.all(
      feedPosts.map(async (post: Doc<"posts">): Promise<PostWithAuthor> => {
        const author: Doc<"users"> | null = await ctx.db.get(post.authorId);
        return {
          ...post,
          author: author
            ? {
                _id: author._id,
                name: author.name,
                username: author.username,
                imageUrl: author.imageUrl,
              }
            : null,
        };
      })
    );

    return {
      posts: postsWithAuthors.filter(
        (post: PostWithAuthor) => post.author !== null
      ),
      hasMore,
    };
  },
});

// Get suggested users to follow
export const getSuggestedUsers = query({
  args: { limit: v.optional(v.number()) },
  handler: async (
    ctx,
    args: GetSuggestedUsersArgs
  ): Promise<SuggestedUser[]> => {
    const identity = await ctx.auth.getUserIdentity();
    const limit: number = args.limit || 10;

    let currentUser: Doc<"users"> | null = null;
    let followedUserIds: Id<"users">[] = [];

    if (identity) {
      currentUser = await ctx.db
        .query("users")
        .filter((q) =>
          q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier)
        )
        .unique();

      if (currentUser) {
        // Get users already being followed
        const follows: Doc<"follows">[] = await ctx.db
          .query("follows")
          .filter((q) => q.eq(q.field("followerId"), currentUser!._id))
          .collect();

        followedUserIds = follows.map(
          (follow: Doc<"follows">) => follow.followingId
        );
      }
    }

    // Get users with recent posts who aren't being followed
    const allUsers: Doc<"users">[] = await ctx.db
      .query("users")
      .filter((q) =>
        q.neq(q.field("_id"), currentUser?._id || ("" as Id<"users">))
      )
      .collect();

    // Filter out already followed users and get their stats
    const suggestions: SuggestedUser[] = await Promise.all(
      allUsers
        .filter(
          (user: Doc<"users">) =>
            !followedUserIds.includes(user._id) && user.username
        )
        .map(async (user: Doc<"users">): Promise<SuggestedUser> => {
          // Get user's published posts
          const posts: Doc<"posts">[] = await ctx.db
            .query("posts")
            .filter((q) =>
              q.and(
                q.eq(q.field("authorId"), user._id),
                q.eq(q.field("status"), "published")
              )
            )
            .order("desc")
            .take(5);

          // Get follower count
          const followers: Doc<"follows">[] = await ctx.db
            .query("follows")
            .filter((q) => q.eq(q.field("followingId"), user._id))
            .collect();

          // Calculate engagement score for ranking
          const totalViews: number = posts.reduce(
            (sum: number, post: Doc<"posts">) => sum + post.viewCount,
            0
          );
          const totalLikes: number = posts.reduce(
            (sum: number, post: Doc<"posts">) => sum + post.likeCount,
            0
          );
          const engagementScore: number =
            totalViews + totalLikes * 5 + followers.length * 10;

          return {
            _id: user._id,
            name: user.name,
            username: user.username,
            imageUrl: user.imageUrl,
            followerCount: followers.length,
            postCount: posts.length,
            engagementScore,
            lastPostAt: posts.length > 0 ? posts[0].publishedAt || null : null,
            recentPosts: posts.slice(0, 2).map((post: Doc<"posts">): RecentPost => ({
              _id: post._id,
              title: post.title,
              viewCount: post.viewCount,
              likeCount: post.likeCount,
            })),
          };
        })
    );

    // Sort by engagement score and recent activity
    const rankedSuggestions: SuggestedUser[] = suggestions
      .filter((user: SuggestedUser) => user.postCount > 0) // Only users with posts
      .sort((a: SuggestedUser, b: SuggestedUser) => {
        // Prioritize recent activity
        const aRecent: boolean =
          (a.lastPostAt || 0) > Date.now() - 7 * 24 * 60 * 60 * 1000;
        const bRecent: boolean =
          (b.lastPostAt || 0) > Date.now() - 7 * 24 * 60 * 60 * 1000;

        if (aRecent && !bRecent) return -1;
        if (!aRecent && bRecent) return 1;

        // Then by engagement score
        return b.engagementScore - a.engagementScore;
      })
      .slice(0, limit);

    return rankedSuggestions;
  },
});

// Get trending posts (high engagement in last 7 days)
export const getTrendingPosts = query({
  args: { limit: v.optional(v.number()) },
  handler: async (
    ctx,
    args: GetTrendingPostsArgs
  ): Promise<TrendingPost[]> => {
    const limit: number = args.limit || 10;
    const weekAgo: number = Date.now() - 7 * 24 * 60 * 60 * 1000;

    // Get recent published posts
    const recentPosts: Doc<"posts">[] = await ctx.db
      .query("posts")
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "published"),
          q.gte(q.field("publishedAt"), weekAgo)
        )
      )
      .collect();

    // Calculate trending score and sort
    const trendingPosts: (Doc<"posts"> & { trendingScore: number })[] =
      recentPosts
        .map((post: Doc<"posts">) => ({
          ...post,
          trendingScore: post.viewCount + post.likeCount * 3,
        }))
        .sort(
          (
            a: Doc<"posts"> & { trendingScore: number },
            b: Doc<"posts"> & { trendingScore: number }
          ) => b.trendingScore - a.trendingScore
        )
        .slice(0, limit);

    // Add author information
    const postsWithAuthors: TrendingPost[] = await Promise.all(
      trendingPosts.map(
        async (
          post: Doc<"posts"> & { trendingScore: number }
        ): Promise<TrendingPost> => {
          const author: Doc<"users"> | null = await ctx.db.get(post.authorId);
          return {
            ...post,
            author: author
              ? {
                  _id: author._id,
                  name: author.name,
                  username: author.username,
                  imageUrl: author.imageUrl,
                }
              : null,
          };
        }
      )
    );

    return postsWithAuthors.filter(
      (post: TrendingPost) => post.author !== null
    );
  },
});