import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function generateEntryCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += "-";
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function getSessionUser(ctx: any, token: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q: any) => q.eq("token", token))
    .first();
  if (!session || session.expiresAt < Date.now()) return null;
  return await ctx.db.get(session.userId);
}

export const registerForEvent = mutation({
  args: {
    sessionToken: v.string(),
    eventId: v.id("events"),
    paymentOption: v.union(v.literal("pay_now"), v.literal("pay_later")),
    submissionType: v.optional(
      v.union(v.literal("file"), v.literal("gdrive_link"), v.literal("none")),
    ),
    submissionFileId: v.optional(v.string()),
    submissionFileName: v.optional(v.string()),
    submissionGdriveLink: v.optional(v.string()),
    submissionNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx, args.sessionToken);
    if (!user) return { success: false, error: "Please log in to register." };

    const event = await ctx.db.get(args.eventId);
    if (!event) return { success: false, error: "Event not found." };
    if (!event.published)
      return { success: false, error: "Event not available." };

    const existing = await ctx.db
      .query("registrations")
      .withIndex("by_user_event", (q) =>
        q.eq("userId", user._id).eq("eventId", args.eventId),
      )
      .first();
    if (existing)
      return {
        success: false,
        error: "You are already registered for this event.",
      };

    const isFree = event.isFree || event.price === 0;
    let paymentStatus: "free" | "pending" | "paid" = "pending";
    let entryCode: string | undefined;

    if (isFree) {
      paymentStatus = "free";
      entryCode = generateEntryCode();
    } else if (args.paymentOption === "pay_now") {
      paymentStatus = "paid";
      entryCode = generateEntryCode();
    } else {
      paymentStatus = "pending";
    }

    const regId = await ctx.db.insert("registrations", {
      eventId: args.eventId,
      userId: user._id,
      paymentStatus,
      paymentOption: args.paymentOption,
      amount: event.price,
      paidAt:
        paymentStatus === "paid" || paymentStatus === "free"
          ? Date.now()
          : undefined,
      entryCode,
      passGenerated: !!entryCode,
      submissionType: args.submissionType,
      submissionFileId: args.submissionFileId,
      submissionFileName: args.submissionFileName,
      submissionGdriveLink: args.submissionGdriveLink,
      submissionNotes: args.submissionNotes,
      createdAt: Date.now(),
    });

    return {
      success: true,
      registrationId: regId,
      paymentStatus,
      entryCode,
    };
  },
});

export const completePayment = mutation({
  args: {
    sessionToken: v.string(),
    registrationId: v.id("registrations"),
  },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx, args.sessionToken);
    if (!user) return { success: false, error: "Unauthorized" };

    const reg = await ctx.db.get(args.registrationId);
    if (!reg) return { success: false, error: "Registration not found." };
    if (reg.userId !== user._id) return { success: false, error: "Forbidden." };
    if (reg.paymentStatus === "paid")
      return { success: false, error: "Already paid." };

    const entryCode = generateEntryCode();

    await ctx.db.patch(args.registrationId, {
      paymentStatus: "paid",
      paidAt: Date.now(),
      entryCode,
      passGenerated: true,
    });

    return { success: true, entryCode };
  },
});

export const getRegistration = query({
  args: { sessionToken: v.string(), registrationId: v.id("registrations") },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx, args.sessionToken);
    if (!user) return null;

    const reg = await ctx.db.get(args.registrationId);
    if (!reg) return null;
    if (reg.userId !== user._id && !user.isAdmin) return null;

    const event = await ctx.db.get(reg.eventId);
    return { ...reg, event };
  },
});

export const getUserRegistrations = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx, args.sessionToken);
    if (!user) return null;

    const regs = await ctx.db
      .query("registrations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    const result = await Promise.all(
      regs.map(async (r) => {
        const event = await ctx.db.get(r.eventId);
        return { ...r, event };
      }),
    );
    return result;
  },
});

export const getEventRegistrations = query({
  args: { sessionToken: v.string(), eventId: v.id("events") },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx, args.sessionToken);
    if (!user?.isAdmin) return null;

    const regs = await ctx.db
      .query("registrations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .order("desc")
      .collect();

    const result = await Promise.all(
      regs.map(async (r) => {
        const registrant = await ctx.db.get(r.userId);
        return {
          ...r,
          registrant: registrant
            ? {
                id: registrant._id,
                name: registrant.name,
                email: registrant.email,
              }
            : null,
        };
      }),
    );
    return result;
  },
});

export const getAllRegistrations = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx, args.sessionToken);
    if (!user?.isAdmin) return null;

    const regs = await ctx.db.query("registrations").order("desc").collect();
    const result = await Promise.all(
      regs.map(async (r) => {
        const event = await ctx.db.get(r.eventId);
        const registrant = await ctx.db.get(r.userId);
        return {
          ...r,
          event,
          registrant: registrant
            ? {
                id: registrant._id,
                name: registrant.name,
                email: registrant.email,
              }
            : null,
        };
      }),
    );
    return result;
  },
});

export const generateUploadUrl = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx, args.sessionToken);
    if (!user) return { success: false, error: "Unauthorized" };
    const url = await ctx.storage.generateUploadUrl();
    return { success: true, url };
  },
});

export const getFileUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const verifyEntryCode = query({
  args: { eventId: v.id("events"), entryCode: v.string() },
  handler: async (ctx, args) => {
    const registration = await ctx.db
      .query("registrations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect()
      .then((regs) => regs.find((r) => r.entryCode === args.entryCode));

    if (!registration) {
      return { success: false, error: "Invalid entry code" };
    }

    const user = await ctx.db.get(registration.userId);
    const event = await ctx.db.get(registration.eventId);

    return {
      success: true,
      registration,
      user: user
        ? {
            id: user._id,
            name: user.name,
            email: user.email,
          }
        : null,
      event: event
        ? {
            id: event._id,
            title: event.title,
          }
        : null,
    };
  },
});
