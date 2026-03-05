import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ── list published events ──────────────────────────────────────────────────

export const listEvents = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("events")
      .filter((q) => q.eq(q.field("published"), true))
      .order("desc")
      .collect();
  },
});

// ── get event by slug ──────────────────────────────────────────────────────

export const getEventBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("events")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

// ── get all events (admin) ─────────────────────────────────────────────────

export const listAllEvents = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();
    if (!session || session.expiresAt < Date.now()) return null;
    const user = await ctx.db.get(session.userId);
    if (!user?.isAdmin) return null;

    return await ctx.db.query("events").order("desc").collect();
  },
});

// ── create event (admin) ───────────────────────────────────────────────────

export const createEvent = mutation({
  args: {
    sessionToken: v.string(),
    title: v.string(),
    slug: v.string(),
    excerpt: v.string(),
    description: v.string(),
    date: v.string(),
    location: v.string(),
    capacity: v.number(),
    price: v.number(),
    imageGallery: v.array(v.string()),
    coverImage: v.string(),
    tag: v.string(),
    accent: v.string(),
    featured: v.boolean(),
    published: v.boolean(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();
    if (!session || session.expiresAt < Date.now())
      return { success: false, error: "Unauthorized" };
    const user = await ctx.db.get(session.userId);
    if (!user?.isAdmin) return { success: false, error: "Forbidden" };

    const { sessionToken, ...eventData } = args;
    const id = await ctx.db.insert("events", {
      ...eventData,
      isFree: eventData.price === 0,
      createdAt: Date.now(),
    });
    return { success: true, id };
  },
});

export const updateEvent = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id("events"),
    title: v.string(),
    slug: v.string(),
    excerpt: v.string(),
    description: v.string(),
    date: v.string(),
    location: v.string(),
    capacity: v.number(),
    price: v.number(),
    imageGallery: v.array(v.string()),
    coverImage: v.string(),
    tag: v.string(),
    accent: v.string(),
    featured: v.boolean(),
    published: v.boolean(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();
    if (!session || session.expiresAt < Date.now())
      return { success: false, error: "Unauthorized" };
    const user = await ctx.db.get(session.userId);
    if (!user?.isAdmin) return { success: false, error: "Forbidden" };

    const { sessionToken, id, ...eventData } = args;
    await ctx.db.patch(id, { ...eventData, isFree: eventData.price === 0 });
    return { success: true };
  },
});

export const deleteEvent = mutation({
  args: { sessionToken: v.string(), id: v.id("events") },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();
    if (!session || session.expiresAt < Date.now())
      return { success: false, error: "Unauthorized" };
    const user = await ctx.db.get(session.userId);
    if (!user?.isAdmin) return { success: false, error: "Forbidden" };
    await ctx.db.delete(args.id);
    return { success: true };
  },
});
