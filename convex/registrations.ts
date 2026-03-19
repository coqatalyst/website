import {
  mutation,
  query,
  action,
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { Resend } from "resend";
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
    } else {
      paymentStatus = "pending";
    }

    const regId = await ctx.db.insert("registrations", {
      eventId: args.eventId,
      userId: user._id,
      paymentStatus,
      paymentOption: args.paymentOption,
      amount: event.price,
      paidAt: paymentStatus === "free" ? Date.now() : undefined,
      entryCode,
      passGenerated: !!entryCode,
      submissionType: args.submissionType,
      submissionFileId: args.submissionFileId,
      submissionFileName: args.submissionFileName,
      submissionGdriveLink: args.submissionGdriveLink,
      submissionNotes: args.submissionNotes,
      attended: false,
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
    let storageId = args.storageId.trim();

    // Handle case where storageId might be stringified JSON
    if (storageId.startsWith("{")) {
      try {
        const parsed = JSON.parse(storageId);
        storageId = parsed.storageId || parsed;
        if (typeof storageId === "object") {
          storageId = parsed.storageId || "";
        }
      } catch {
        // Not JSON, continue with original value
      }
    }

    if (!storageId) {
      return null;
    }

    try {
      return await ctx.storage.getUrl(storageId);
    } catch (error) {
      console.error("Failed to get storage URL:", error);
      return null;
    }
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

export const uploadPaymentProof = mutation({
  args: {
    sessionToken: v.string(),
    registrationId: v.id("registrations"),
    storageId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx, args.sessionToken);
    if (!user) return { success: false, error: "Unauthorized" };

    const reg = await ctx.db.get(args.registrationId);
    if (!reg) return { success: false, error: "Registration not found." };
    if (reg.userId !== user._id) return { success: false, error: "Forbidden." };

    // Parse and validate the storage ID
    let storageId = args.storageId.trim();

    // Handle case where storageId might be stringified JSON
    if (storageId.startsWith("{")) {
      try {
        const parsed = JSON.parse(storageId);
        storageId = parsed.storageId || parsed;
        if (typeof storageId === "object") {
          storageId = parsed.storageId || "";
        }
      } catch {
        // Not JSON, continue with original value
      }
    }

    if (!storageId) {
      return { success: false, error: "Invalid storage ID format." };
    }

    let paymentProofUrl: string | null;
    try {
      paymentProofUrl = await ctx.storage.getUrl(storageId);
    } catch (error) {
      console.error("Failed to get storage URL:", error);
      return {
        success: false,
        error:
          "Failed to resolve payment proof URL. Please try uploading again.",
      };
    }

    if (!paymentProofUrl)
      return { success: false, error: "Failed to resolve image URL." };

    await ctx.db.patch(args.registrationId, {
      paymentProofStorageId: storageId,
      paymentProofUrl: paymentProofUrl,
      paymentVerificationStatus: "pending",
    });

    return {
      success: true,
      message: "Payment proof submitted for verification.",
    };
  },
});

export const verifyPayment = mutation({
  args: {
    sessionToken: v.string(),
    registrationId: v.id("registrations"),
    approved: v.boolean(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx, args.sessionToken);
    if (!user?.isAdmin)
      return { success: false, error: "Admin access required." };

    const reg = await ctx.db.get(args.registrationId);
    if (!reg) return { success: false, error: "Registration not found." };

    const registrant = await ctx.db.get(reg.userId);
    const event = await ctx.db.get(reg.eventId);

    if (args.approved) {
      const entryCode = generateEntryCode();
      await ctx.db.patch(args.registrationId, {
        paymentVerificationStatus: "approved",
        paymentVerificationNotes: args.notes,
        paymentStatus: "paid",
        paidAt: Date.now(),
        entryCode,
        passGenerated: true,
      });

      if (registrant && event) {
        await ctx.scheduler.runAfter(
          0,
          internal.registrations.sendPaymentApprovalEmail,
          {
            email: registrant.email,
            name: registrant.name,
            eventName: event.title,
            entryCode: entryCode,
          },
        );
      }

      return { success: true, entryCode };
    } else {
      await ctx.db.patch(args.registrationId, {
        paymentVerificationStatus: "rejected",
        paymentVerificationNotes: args.notes,
      });

      if (registrant && event) {
        await ctx.scheduler.runAfter(
          0,
          internal.registrations.sendPaymentRejectionEmail,
          {
            email: registrant.email,
            name: registrant.name,
            eventName: event.title,
            reason: args.notes,
          },
        );
      }

      return { success: true };
    }
  },
});

export const sendPaymentApprovalEmail = internalAction({
  args: {
    email: v.string(),
    name: v.string(),
    eventName: v.string(),
    entryCode: v.string(),
  },
  handler: async (ctx, args) => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    try {
      await resend.emails.send({
        from: "CoQatalyst <noreply@coqatalyst.com>",
        to: [args.email],
        subject: `Payment Approved: ${args.eventName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Payment Verified!</h2>
            <p>Hi ${args.name},</p>
            <p>Great news! Your payment for <strong>${args.eventName}</strong> has been successfully verified.</p>
            <p>Your registration is now complete. Below is your entry code, which you'll need at the door:</p>
            <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0;">
              ${args.entryCode}
            </div>
            <p>You can also view this code anytime from your <a href="https://coqatalyst.com/dashboard">Dashboard</a>.</p>
            <p>See you there!</p>
            <p>- The CoQatalyst Team</p>
          </div>
        `,
      });
    } catch (error) {
      console.error("Failed to send payment approval email:", error);
    }
  },
});

export const sendPaymentRejectionEmail = internalAction({
  args: {
    email: v.string(),
    name: v.string(),
    eventName: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    try {
      await resend.emails.send({
        from: "CoQatalyst <noreply@coqatalyst.com>",
        to: [args.email],
        subject: `Payment Rejected: ${args.eventName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Payment Verification Update</h2>
            <p>Hi ${args.name},</p>
            <p>We reviewed your payment for <strong>${args.eventName}</strong> and were unable to approve it.</p>
            ${
              args.reason
                ? `<p><strong>Reason:</strong> ${args.reason}</p>`
                : ""
            }
            <p>Please update your payment proof and resubmit it if needed.</p>
            <p>- The CoQatalyst Team</p>
          </div>
        `,
      });
    } catch (error) {
      console.error("Failed to send payment rejection email:", error);
    }
  },
});

export const getPendingPaymentVerifications = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx, args.sessionToken);
    if (!user?.isAdmin) return null;

    const regs = await ctx.db.query("registrations").collect();
    const pending = regs.filter(
      (r) => r.paymentVerificationStatus === "pending" && r.paymentProofUrl,
    );

    const result = await Promise.all(
      pending.map(async (r) => {
        const registrant = await ctx.db.get(r.userId);
        const event = await ctx.db.get(r.eventId);
        return {
          ...r,
          registrant: registrant
            ? {
                id: registrant._id,
                name: registrant.name,
                email: registrant.email,
              }
            : null,
          event,
        };
      }),
    );
    return result.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const markAttendance = mutation({
  args: {
    registrationId: v.id("registrations"),
    entryCode: v.string(),
  },
  handler: async (ctx, args) => {
    const registration = await ctx.db.get(args.registrationId);
    if (!registration) {
      return { success: false, error: "Registration not found." };
    }

    // Verify the entry code matches
    if (registration.entryCode !== args.entryCode) {
      return {
        success: false,
        error: "Invalid entry code for this registration.",
      };
    }

    // Mark as attended
    await ctx.db.patch(args.registrationId, {
      attended: true,
      attendedAt: Date.now(),
    });

    // Return updated registration with related data
    const user = await ctx.db.get(registration.userId);
    const event = await ctx.db.get(registration.eventId);

    return {
      success: true,
      message: registration.attended
        ? "Already marked as attended"
        : "Successfully marked as attended",
      registration: {
        ...registration,
        attended: true,
        attendedAt: Date.now(),
      },
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
