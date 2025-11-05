import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ✅ Type for update fields
type PartialPostUpdate = {
  title?: string;
  content?: string;
  status?: "draft" | "published";
  tags?: string[];
  category?: string;
  featuredImage?: string;
  scheduledFor?: number;
  updatedAt?: number;
  publishedAt?: number;
};

// ✅ Create a new post
export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    status: v.union(v.literal("draft"), v.literal("published")),
    tags: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
    featuredImage: v.optional(v.string()),
    scheduledFor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .unique();

    if (!user) throw new Error("User not found");

    const existingDraft = await ctx.db
      .query("posts")
      .filter(q =>
        q.and(
          q.eq(q.field("authorId"), user._id),
          q.eq(q.field("status"), "draft")
        )
      )
      .unique();

    const now = Date.now();

    // ✅ Publish existing draft
    if (args.status === "published" && existingDraft) {
      await ctx.db.patch(existingDraft._id, {
        title: args.title,
        content: args.content,
        status: "published",
        tags: args.tags || [],
        category: args.category,
        featuredImage: args.featuredImage,
        updatedAt: now,
        publishedAt: now,
        scheduledFor: args.scheduledFor,
      });
      return existingDraft._id;
    }

    // ✅ Update existing draft
    if (args.status === "draft" && existingDraft) {
      await ctx.db.patch(existingDraft._id, {
        title: args.title,
        content: args.content,
        tags: args.tags || [],
        category: args.category,
        featuredImage: args.featuredImage,
        updatedAt: now,
        scheduledFor: args.scheduledFor,
      });
      return existingDraft._id;
    }

    // ✅ Create new post
    const postId = await ctx.db.insert("posts", {
      title: args.title,
      content: args.content,
      status: args.status,
      authorId: user._id,
      tags: args.tags || [],
      category: args.category,
      featuredImage: args.featuredImage,
      createdAt: now,
      updatedAt: now,
      publishedAt: args.status === "published" ? now : undefined,
      scheduledFor: args.scheduledFor,
      viewCount: 0,
      likeCount: 0,
    });

    return postId;
  },
});

// ✅ Update a post
export const update = mutation({
  args: {
    id: v.id("posts"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
    tags: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
    featuredImage: v.optional(v.string()),
    scheduledFor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .unique();

    if (!user) throw new Error("User not found");

    const post = await ctx.db.get(args.id);
    if (!post) throw new Error("Post not found");

    if (post.authorId !== user._id) throw new Error("Not authorized");

    const now = Date.now();

    const updateData: PartialPostUpdate = {
      updatedAt: now,
    };

    // ✅ Add provided fields
    if (args.title !== undefined) updateData.title = args.title;
    if (args.content !== undefined) updateData.content = args.content;
    if (args.tags !== undefined) updateData.tags = args.tags;
    if (args.category !== undefined) updateData.category = args.category;
    if (args.featuredImage !== undefined)
      updateData.featuredImage = args.featuredImage;
    if (args.scheduledFor !== undefined)
      updateData.scheduledFor = args.scheduledFor;

    // ✅ Handle status change
    if (args.status !== undefined) {
      updateData.status = args.status;

      if (args.status === "published" && post.status === "draft") {
        updateData.publishedAt = now;
      }
    }

    await ctx.db.patch(args.id, updateData);
    return args.id;
  },
});

// ✅ Get single user's draft
export const getUserDraft = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .unique();

    if (!user) return null;

    return await ctx.db
      .query("posts")
      .filter(q =>
        q.and(
          q.eq(q.field("authorId"), user._id),
          q.eq(q.field("status"), "draft")
        )
      )
      .unique();
  },
});

// ✅ Get user's posts
export const getUserPosts = query({
  args: {
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .unique();

    if (!user) return [];

    let q = ctx.db
      .query("posts")
      .filter(q => q.eq(q.field("authorId"), user._id));

    if (args.status) {
      q = q.filter(q => q.eq(q.field("status"), args.status));
    }

    const posts = await q.order("desc").collect();

    return posts.map(post => ({
      ...post,
      username: user.username,
    }));
  },
});

// ✅ Get post by ID
export const getById = query({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ✅ Delete post
export const deletePost = mutation({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .unique();

    if (!user) throw new Error("User not found");

    const post = await ctx.db.get(args.id);
    if (!post) throw new Error("Post not found");

    if (post.authorId !== user._id) throw new Error("Not authorized");

    await ctx.db.delete(args.id);
    return { success: true };
  },
});
