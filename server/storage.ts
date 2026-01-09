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

export interface LicenseUpdateData {
  gumroadLicenseKey: string | null;
  gumroadProductId: string | null;
  licenseEmail: string | null;
  licenseValidatedAt: Date | null;
}

export interface IStorage {
  getSubscription(userId: string): Promise<Subscription | undefined>;
  createOrUpdateSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscriptionLicense(userId: string, licenseData: LicenseUpdateData): Promise<Subscription | undefined>;
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

  async updateSubscriptionLicense(userId: string, licenseData: LicenseUpdateData): Promise<Subscription | undefined> {
    const [subscription] = await db
      .update(subscriptions)
      .set({
        gumroadLicenseKey: licenseData.gumroadLicenseKey,
        gumroadProductId: licenseData.gumroadProductId,
        licenseEmail: licenseData.licenseEmail,
        licenseValidatedAt: licenseData.licenseValidatedAt,
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
