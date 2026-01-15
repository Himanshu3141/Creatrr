import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id, Doc } from "./_generated/dataModel";

// Type definitions
type CommentAuthor = {
  _id: Id<"users">;
  name: string;
  username?: string;
  imageUrl?: string;
};

type CommentWithAuthor = Doc<"comments"> & {
  author: CommentAuthor | null;
};

type AddCommentArgs = {
  postId: Id<"posts">;
  content: string;
};

type GetPostCommentsArgs = {
  postId: Id<"posts">;
};

type DeleteCommentArgs = {
  commentId: Id<"comments">;
};

type DeleteCommentResponse = {
  success: boolean;
};

// Add a comment to a post
export const addComment = mutation({
  args: {
    postId: v.id("posts"),
    content: v.string(),
  },
  handler: async (ctx, args: AddCommentArgs): Promise<Id<"comments">> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Must be logged in to comment");
    }

    const user: Doc<"users"> | null = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const post: Doc<"posts"> | null = await ctx.db.get(args.postId);

    if (!post || post.status !== "published") {
      throw new Error("Post not found or not published");
    }

    // Validate content
    if (!args.content.trim() || args.content.length > 1000) {
      throw new Error("Comment must be between 1-1000 characters");
    }

    const commentId: Id<"comments"> = await ctx.db.insert("comments", {
      postId: args.postId,
      authorId: user._id,
      authorName: user.name,
      authorEmail: user.email,
      content: args.content.trim(),
      status: "approved", // Auto-approve since only authenticated users can comment
      createdAt: Date.now(),
    });

    return commentId;
  },
});

// Get comments for a post
export const getPostComments = query({
  args: { postId: v.id("posts") },
  handler: async (
    ctx,
    args: GetPostCommentsArgs
  ): Promise<CommentWithAuthor[]> => {
    const comments: Doc<"comments">[] = await ctx.db
      .query("comments")
      .filter((q) =>
        q.and(
          q.eq(q.field("postId"), args.postId),
          q.eq(q.field("status"), "approved")
        )
      )
      .order("asc")
      .collect();

    // Add user info for all comments (since all are from authenticated users)
    const commentsWithUsers: CommentWithAuthor[] = await Promise.all(
      comments.map(async (comment: Doc<"comments">): Promise<CommentWithAuthor> => {
        const user: Doc<"users"> | null = comment.authorId
          ? await ctx.db.get(comment.authorId)
          : null;
        return {
          ...comment,
          author: user
            ? {
                _id: user._id,
                name: user.name,
                username: user.username,
                imageUrl: user.imageUrl,
              }
            : null,
        };
      })
    );

    return commentsWithUsers.filter(
      (comment: CommentWithAuthor) => comment.author !== null
    );
  },
});

// Delete a comment (only by author or post owner)
export const deleteComment = mutation({
  args: { commentId: v.id("comments") },
  handler: async (
    ctx,
    args: DeleteCommentArgs
  ): Promise<DeleteCommentResponse> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user: Doc<"users"> | null = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("tokenIdentifier"), identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const comment: Doc<"comments"> | null = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    // Get the post to check if user is the post owner
    const post: Doc<"posts"> | null = await ctx.db.get(comment.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    // Check if user can delete this comment (comment author or post owner)
    const canDelete: boolean =
      comment.authorId === user._id || post.authorId === user._id;

    if (!canDelete) {
      throw new Error("Not authorized to delete this comment");
    }

    await ctx.db.delete(args.commentId);
    return { success: true };
  },
});