import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const authTables = {
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    // HMAC of the user's verified phone (lib/phone.hashPhone). Set by the Clerk webhook.
    phoneHash: v.optional(v.string()),
  }).index('byClerkId', ['clerkId']),

  // Free-tier abuse ledger. Keyed by phoneHash, decoupled from the user row, and intentionally
  // NOT deleted on user.deleted so one verified phone gets one free tier across re-signups.
  // Stores only the hash, never the raw number (fraud-prevention legitimate interest).
  phoneLedger: defineTable({
    phoneHash: v.string(),
    firstSeenAt: v.number(),
    freeWorkspacesCreated: v.number(),
    lifetimeEvents: v.number(),
  }).index('byPhoneHash', ['phoneHash']),
};

export default authTables;
