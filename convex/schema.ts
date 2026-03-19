import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    passwordHash: v.string(),
    emailVerified: v.boolean(),
    verificationToken: v.optional(v.string()),
    verificationTokenExpiry: v.optional(v.number()),
    isAdmin: v.boolean(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  }).index("by_token", ["token"]),

  events: defineTable({
    title: v.string(),
    slug: v.string(),
    excerpt: v.string(),
    description: v.string(),
    date: v.string(),
    location: v.string(),
    capacity: v.number(),
    price: v.number(),
    isFree: v.boolean(),
    imageGallery: v.array(v.string()),
    coverImage: v.string(),
    coverImageStorageId: v.optional(v.string()),
    imageGalleryStorageIds: v.optional(v.array(v.string())),
    tag: v.string(),
    accent: v.string(),
    featured: v.boolean(),
    published: v.boolean(),
    createdAt: v.number(),
  }).index("by_slug", ["slug"]),

  blogs: defineTable({
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
    coverImageStorageId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_slug", ["slug"]),

  registrations: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("free"),
    ),
    paymentOption: v.union(v.literal("pay_now"), v.literal("pay_later")),
    amount: v.number(),
    paidAt: v.optional(v.number()),
    entryCode: v.optional(v.string()),
    entryCodeQR: v.optional(v.string()),
    passGenerated: v.boolean(),
    submissionType: v.optional(
      v.union(v.literal("file"), v.literal("gdrive_link"), v.literal("none")),
    ),
    submissionFileUrl: v.optional(v.string()),
    submissionFileId: v.optional(v.string()),
    submissionFileName: v.optional(v.string()),
    submissionGdriveLink: v.optional(v.string()),
    submissionNotes: v.optional(v.string()),
    paymentProofStorageId: v.optional(v.string()),
    paymentProofUrl: v.optional(v.string()),
    paymentVerificationStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected"),
      ),
    ),
    paymentVerificationNotes: v.optional(v.string()),
    upiTransactionId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_event", ["eventId"])
    .index("by_user_event", ["userId", "eventId"]),
});
