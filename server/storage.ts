import { 
  subscriptions, 
  userPreferences,
  type Subscription, 
  type InsertSubscription,
  type UserPreferences,
  type InsertUserPreferences
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
