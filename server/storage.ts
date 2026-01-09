import { 
  subscriptions, 
  userPreferences,
  telegramLinkTokens,
  telegramPayments,
  type Subscription, 
  type InsertSubscription,
  type UserPreferences,
  type InsertUserPreferences,
  type TelegramLinkToken,
  type TelegramPayment,
  type InsertTelegramPayment
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, lt, ne } from "drizzle-orm";

export interface TelegramPaymentData {
  telegramUserId: string;
  telegramPaymentChargeId: string;
  paidAt: Date;
}

export interface IStorage {
  getSubscription(userId: string): Promise<Subscription | undefined>;
  getSubscriptionByTelegramId(telegramUserId: string): Promise<Subscription | undefined>;
  getSubscriptionsByTelegramId(telegramUserId: string): Promise<Subscription[]>;
  createOrUpdateSubscription(subscription: InsertSubscription): Promise<Subscription>;
  activatePremiumByUserId(userId: string, paymentData: TelegramPaymentData): Promise<Subscription | undefined>;
  linkTelegramAccount(userId: string, telegramUserId: string): Promise<Subscription | undefined>;
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  createOrUpdateUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  createTelegramLinkToken(userId: string): Promise<string>;
  getTelegramLinkToken(tokenId: string): Promise<TelegramLinkToken | undefined>;
  deleteTelegramLinkToken(tokenId: string): Promise<void>;
  // Telegram payments
  createTelegramPayment(payment: InsertTelegramPayment & { expiresAt: Date }): Promise<TelegramPayment>;
  getTelegramPayment(paymentId: string): Promise<TelegramPayment | undefined>;
  getPendingPaymentForUser(userId: string): Promise<TelegramPayment | undefined>;
  markPaymentPaid(paymentId: string, chargeId: string): Promise<TelegramPayment | undefined>;
  markPaymentExpired(paymentId: string): Promise<void>;
  expireOldPayments(): Promise<void>;
  getPaymentHistory(telegramUserId: string): Promise<TelegramPayment[]>;
}

export class DatabaseStorage implements IStorage {
  async getSubscription(userId: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));
    return subscription;
  }

  async createOrUpdateSubscription(subscriptionData: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db
      .insert(subscriptions)
      .values(subscriptionData)
      .onConflictDoUpdate({
        target: subscriptions.userId,
        set: {
          tier: subscriptionData.tier,
          maxWpm: subscriptionData.maxWpm,
          updatedAt: new Date(),
        },
      })
      .returning();
    return subscription;
  }

  async getSubscriptionByTelegramId(telegramUserId: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.telegramUserId, telegramUserId));
    return subscription;
  }

  async getSubscriptionsByTelegramId(telegramUserId: string): Promise<Subscription[]> {
    return await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.telegramUserId, telegramUserId));
  }

  async activatePremiumByUserId(userId: string, paymentData: TelegramPaymentData): Promise<Subscription | undefined> {
    const [subscription] = await db
      .update(subscriptions)
      .set({
        tier: "premium",
        maxWpm: 1000,
        telegramUserId: paymentData.telegramUserId,
        telegramPaymentChargeId: paymentData.telegramPaymentChargeId,
        paidAt: paymentData.paidAt,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.userId, userId))
      .returning();
    return subscription;
  }

  async linkTelegramAccount(userId: string, telegramUserId: string): Promise<Subscription | undefined> {
    // Now allows same Telegram ID to be linked to multiple app accounts
    // Each app account can only have one Telegram ID though
    const currentSub = await this.getSubscription(userId);
    if (currentSub?.telegramUserId && currentSub.telegramUserId !== telegramUserId) {
      throw new Error("Account already linked to a different Telegram account");
    }
    
    const [subscription] = await db
      .update(subscriptions)
      .set({
        telegramUserId,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.userId, userId))
      .returning();
    return subscription;
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return prefs;
  }

  async createOrUpdateUserPreferences(prefsData: InsertUserPreferences): Promise<UserPreferences> {
    const [prefs] = await db
      .insert(userPreferences)
      .values(prefsData)
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          defaultWpm: prefsData.defaultWpm,
          gradualStart: prefsData.gradualStart,
          pauseOnPunctuation: prefsData.pauseOnPunctuation,
          fontSize: prefsData.fontSize,
          updatedAt: new Date(),
        },
      })
      .returning();
    return prefs;
  }

  async createTelegramLinkToken(userId: string): Promise<string> {
    // Generate a short alphanumeric ID (12 chars, safe for Telegram deep links)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let tokenId = '';
    for (let i = 0; i < 12; i++) {
      tokenId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now
    
    await db.insert(telegramLinkTokens).values({
      id: tokenId,
      userId,
      expiresAt,
    });
    
    return tokenId;
  }

  async getTelegramLinkToken(tokenId: string): Promise<TelegramLinkToken | undefined> {
    const [token] = await db
      .select()
      .from(telegramLinkTokens)
      .where(eq(telegramLinkTokens.id, tokenId));
    
    if (!token) return undefined;
    
    // Check if expired
    if (new Date() > token.expiresAt) {
      await this.deleteTelegramLinkToken(tokenId);
      return undefined;
    }
    
    return token;
  }

  async deleteTelegramLinkToken(tokenId: string): Promise<void> {
    await db.delete(telegramLinkTokens).where(eq(telegramLinkTokens.id, tokenId));
  }

  // Telegram payments methods
  async createTelegramPayment(payment: InsertTelegramPayment & { expiresAt: Date }): Promise<TelegramPayment> {
    const [newPayment] = await db
      .insert(telegramPayments)
      .values({
        ...payment,
        status: "pending",
        invoiceIssuedAt: new Date(),
      })
      .returning();
    return newPayment;
  }

  async getTelegramPayment(paymentId: string): Promise<TelegramPayment | undefined> {
    const [payment] = await db
      .select()
      .from(telegramPayments)
      .where(eq(telegramPayments.id, paymentId));
    return payment;
  }

  async getPendingPaymentForUser(userId: string): Promise<TelegramPayment | undefined> {
    const now = new Date();
    const [payment] = await db
      .select()
      .from(telegramPayments)
      .where(
        and(
          eq(telegramPayments.userId, userId),
          eq(telegramPayments.status, "pending"),
          // Only get non-expired payments
        )
      )
      .orderBy(desc(telegramPayments.createdAt))
      .limit(1);
    
    if (payment && new Date(payment.expiresAt) > now) {
      return payment;
    }
    return undefined;
  }

  async markPaymentPaid(paymentId: string, chargeId: string): Promise<TelegramPayment | undefined> {
    const [payment] = await db
      .update(telegramPayments)
      .set({
        status: "paid",
        chargeId,
        paidAt: new Date(),
      })
      .where(eq(telegramPayments.id, paymentId))
      .returning();
    return payment;
  }

  async markPaymentExpired(paymentId: string): Promise<void> {
    await db
      .update(telegramPayments)
      .set({ status: "expired" })
      .where(eq(telegramPayments.id, paymentId));
  }

  async expireOldPayments(): Promise<void> {
    const now = new Date();
    await db
      .update(telegramPayments)
      .set({ status: "expired" })
      .where(
        and(
          eq(telegramPayments.status, "pending"),
          lt(telegramPayments.expiresAt, now)
        )
      );
  }

  async getPaymentHistory(telegramUserId: string): Promise<TelegramPayment[]> {
    return await db
      .select()
      .from(telegramPayments)
      .where(eq(telegramPayments.telegramUserId, telegramUserId))
      .orderBy(desc(telegramPayments.createdAt))
      .limit(10);
  }
}

export const storage = new DatabaseStorage();
