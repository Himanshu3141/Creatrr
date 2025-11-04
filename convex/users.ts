import { mutation, query } from "./_generated/server";

export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    console.log("[users.store] got identity:", identity);
    if (!identity) {
      console.error("[users.store] no identity present");
      throw new Error("Called storeUser without authentication present");
    }

    try {
      const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier),
        )
        .unique();
      console.log("[users.store] lookup result:", user);
      if (user !== null) {
        if (user.name !== identity.name) {
          await ctx.db.patch(user._id, { name: identity.name });
          console.log("[users.store] patched name for", user._id);
        }
        return user._id;
      }
      const newId = await ctx.db.insert("users", {
        name: identity.name ?? "Anonymous",
        tokenIdentifier: identity.tokenIdentifier,
        email: identity.email ?? "",
        imageUrl: identity.pictureUrl ?? undefined,
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
      });
      console.log("[users.store] inserted new user id:", newId);
      return newId;
    } catch (e) {
      console.error("[users.store] error during db ops:", e);
      throw e; // rethrow so the client sees it
    }
  },
});


export const getCurrentUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  },
});
