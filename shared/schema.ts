import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  tier: text("tier").notNull().default("free"),
  maxWpm: integer("max_wpm").notNull().default(350),
  telegramUserId: text("telegram_user_id"), // Not unique - one TG account can pay for multiple app accounts
  telegramPaymentChargeId: text("telegram_payment_charge_id").unique(), // Unique to prevent payment reuse
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).pick({
  userId: true,
  tier: true,
  maxWpm: true,
});

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  defaultWpm: integer("default_wpm").notNull().default(250),
  gradualStart: boolean("gradual_start").notNull().default(true),
  pauseOnPunctuation: boolean("pause_on_punctuation").notNull().default(true),
  fontSize: integer("font_size").notNull().default(64),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).pick({
  userId: true,
  defaultWpm: true,
  gradualStart: true,
  pauseOnPunctuation: true,
  fontSize: true,
});

export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;

// Telegram link tokens - short-lived tokens for deep linking
export const telegramLinkTokens = pgTable("telegram_link_tokens", {
  id: varchar("id", { length: 16 }).primaryKey(), // Short alphanumeric ID for deep links
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

export type TelegramLinkToken = typeof telegramLinkTokens.$inferSelect;

// Telegram payments - track all payment attempts and history
export const telegramPayments = pgTable("telegram_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  telegramUserId: text("telegram_user_id").notNull(),
  telegramChatId: text("telegram_chat_id").notNull(),
  userId: varchar("user_id").notNull(), // App user this payment is for
  userEmail: text("user_email"), // Store email for display purposes
  chargeId: text("charge_id").unique(), // Telegram payment charge ID (unique to prevent double processing)
  amount: integer("amount").notNull(), // Amount in Stars
  status: text("status").notNull().default("pending"), // pending, paid, expired
  invoiceIssuedAt: timestamp("invoice_issued_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(), // Invoice expiration time (1 minute)
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTelegramPaymentSchema = createInsertSchema(telegramPayments).pick({
  telegramUserId: true,
  telegramChatId: true,
  userId: true,
  userEmail: true,
  amount: true,
});

export type InsertTelegramPayment = z.infer<typeof insertTelegramPaymentSchema>;
export type TelegramPayment = typeof telegramPayments.$inferSelect;

// Default books - sample texts available to all users for onboarding
export const defaultBooks = pgTable("default_books", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  wordCount: integer("word_count").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type DefaultBook = typeof defaultBooks.$inferSelect;

