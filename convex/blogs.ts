import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function requireAdmin(ctx: any, sessionToken: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("token", sessionToken))
    .first();
  if (!session || session.expiresAt < Date.now()) return null;
  const user = await ctx.db.get(session.userId);
  if (!user?.isAdmin) return null;
  return user;
}

export const listBlogs = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("blogs")
      .filter((q) => q.eq(q.field("published"), true))
      .order("desc")
      .collect();
  },
});

export const getBlogBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("blogs")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

export const listAllBlogs = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.sessionToken);
    if (!admin) return null;
    return await ctx.db.query("blogs").order("desc").collect();
  },
});

export const createBlog = mutation({
  args: {
    sessionToken: v.string(),
    title: v.string(),
    slug: v.string(),
    excerpt: v.string(),
    content: v.string(),
    author: v.string(),
    date: v.string(),
    tag: v.string(),
    accent: v.string(),
    featured: v.boolean(),
    published: v.boolean(),
    coverImage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.sessionToken);
    if (!admin) return { success: false, error: "Unauthorized" };

    const existing = await ctx.db
      .query("blogs")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (existing) return { success: false, error: "Slug already exists." };

    const { sessionToken, ...blogData } = args;
    const id = await ctx.db.insert("blogs", {
      ...blogData,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return { success: true, id };
  },
});

export const updateBlog = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id("blogs"),
    title: v.string(),
    slug: v.string(),
    excerpt: v.string(),
    content: v.string(),
    author: v.string(),
    date: v.string(),
    tag: v.string(),
    accent: v.string(),
    featured: v.boolean(),
    published: v.boolean(),
    coverImage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.sessionToken);
    if (!admin) return { success: false, error: "Unauthorized" };

    const { sessionToken, id, ...blogData } = args;
    await ctx.db.patch(id, { ...blogData, updatedAt: Date.now() });
    return { success: true };
  },
});

export const deleteBlog = mutation({
  args: { sessionToken: v.string(), id: v.id("blogs") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.sessionToken);
    if (!admin) return { success: false, error: "Unauthorized" };
    await ctx.db.delete(args.id);
    return { success: true };
  },
});
