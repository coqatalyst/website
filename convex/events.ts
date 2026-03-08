import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function resolveEventImages(ctx: any, event: any): Promise<any> {
  const result = { ...event };

  if (event.coverImageStorageId) {
    result.coverImage = await ctx.storage.getUrl(event.coverImageStorageId);
  }

  if (
    event.imageGalleryStorageIds &&
    Array.isArray(event.imageGalleryStorageIds) &&
    event.imageGalleryStorageIds.length > 0
  ) {
    const galleryUrls = await Promise.all(
      event.imageGalleryStorageIds.map((id: string) => ctx.storage.getUrl(id)),
    );
    result.imageGallery = [
      ...(event.imageGallery || []),
      ...galleryUrls.filter(Boolean),
    ];
  }

  return result;
}

export const listEvents = query({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db
      .query("events")
      .filter((q) => q.eq(q.field("published"), true))
      .order("desc")
      .collect();

    return Promise.all(events.map((e) => resolveEventImages(ctx, e)));
  },
});

export const getEventBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("events")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!event) return null;
    return resolveEventImages(ctx, event);
  },
});

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

    const events = await ctx.db.query("events").order("desc").collect();
    return Promise.all(events.map((e) => resolveEventImages(ctx, e)));
  },
});

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
    coverImageStorageId: v.optional(v.string()),
    imageGalleryStorageIds: v.optional(v.array(v.string())),
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
    coverImageStorageId: v.optional(v.string()),
    imageGalleryStorageIds: v.optional(v.array(v.string())),
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
    await ctx.db.patch(id, {
      ...eventData,
      isFree: eventData.price === 0,
    });
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

export const generateEventCoverImageUploadUrl = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();
    if (!session || session.expiresAt < Date.now())
      return { success: false, error: "Unauthorized" };
    const user = await ctx.db.get(session.userId);
    if (!user?.isAdmin) return { success: false, error: "Forbidden" };

    const url = await ctx.storage.generateUploadUrl();
    return { success: true, url };
  },
});

export const generateEventGalleryImageUploadUrl = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();
    if (!session || session.expiresAt < Date.now())
      return { success: false, error: "Unauthorized" };
    const user = await ctx.db.get(session.userId);
    if (!user?.isAdmin) return { success: false, error: "Forbidden" };

    const url = await ctx.storage.generateUploadUrl();
    return { success: true, url };
  },
});

export const getEventImageUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
