import { 
  subscriptions, 
  userPreferences,
  telegramLinkTokens,
  type Subscription, 
  type InsertSubscription,
  type UserPreferences,
  type InsertUserPreferences,
  type TelegramLinkToken
} from "@shared/schema";
import { db } from "./db";
import { eq, gt } from "drizzle-orm";

export interface TelegramPaymentData {
  telegramUserId: string;
  telegramPaymentChargeId: string;
  paidAt: Date;
}

export interface IStorage {
  getSubscription(userId: string): Promise<Subscription | undefined>;
  getSubscriptionByTelegramId(telegramUserId: string): Promise<Subscription | undefined>;
  createOrUpdateSubscription(subscription: InsertSubscription): Promise<Subscription>;
  activatePremiumByTelegram(telegramUserId: string, paymentData: TelegramPaymentData): Promise<Subscription | undefined>;
  linkTelegramAccount(userId: string, telegramUserId: string): Promise<Subscription | undefined>;
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  createOrUpdateUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  createTelegramLinkToken(userId: string): Promise<string>;
  getTelegramLinkToken(tokenId: string): Promise<TelegramLinkToken | undefined>;
  deleteTelegramLinkToken(tokenId: string): Promise<void>;
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

  async activatePremiumByTelegram(telegramUserId: string, paymentData: TelegramPaymentData): Promise<Subscription | undefined> {
    const [subscription] = await db
      .update(subscriptions)
      .set({
        tier: "premium",
        maxWpm: 1000,
        telegramPaymentChargeId: paymentData.telegramPaymentChargeId,
        paidAt: paymentData.paidAt,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.telegramUserId, telegramUserId))
      .returning();
    return subscription;
  }

  async linkTelegramAccount(userId: string, telegramUserId: string): Promise<Subscription | undefined> {
    // Check if telegram ID is already linked to another user
    const existing = await this.getSubscriptionByTelegramId(telegramUserId);
    if (existing && existing.userId !== userId) {
      throw new Error("Telegram account already linked to another user");
    }
    
    // Only allow linking if not already linked to a different telegram ID
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
}

export const storage = new DatabaseStorage();
