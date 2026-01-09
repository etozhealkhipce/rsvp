import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { setupAuthRoutes, requireAuth, findUserById, findUserByEmail } from "./auth";
import { storage } from "./storage";
import { insertSubscriptionSchema, insertUserPreferencesSchema, users } from "@shared/schema";
import { updateEmailSchema, updatePasswordSchema } from "@shared/types/auth";
import { pool, db } from "./db";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const PostgresStore = connectPgSimple(session);

  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    throw new Error("SESSION_SECRET environment variable is required");
  }

  app.use(
    session({
      store: new PostgresStore({
        pool,
        tableName: "sessions",
      }),
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      },
    })
  );

  const authRouter = setupAuthRoutes();
  app.use("/api/auth", authRouter);

  app.get("/api/subscription", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      let subscription = await storage.getSubscription(userId);
      
      if (!subscription) {
        subscription = await storage.createOrUpdateSubscription({
          userId,
          tier: "free",
          maxWpm: 350,
        });
      }
      
      res.json(subscription);
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  app.post("/api/subscription", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const parsed = insertSubscriptionSchema.safeParse({ ...req.body, userId });
      
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid subscription data" });
      }
      
      const subscription = await storage.createOrUpdateSubscription(parsed.data);
      res.json(subscription);
    } catch (error) {
      console.error("Error updating subscription:", error);
      res.status(500).json({ message: "Failed to update subscription" });
    }
  });

  app.get("/api/preferences", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      let preferences = await storage.getUserPreferences(userId);
      
      if (!preferences) {
        preferences = await storage.createOrUpdateUserPreferences({
          userId,
          defaultWpm: 250,
          gradualStart: true,
          pauseOnPunctuation: true,
          fontSize: 64,
        });
      }
      
      res.json(preferences);
    } catch (error) {
      console.error("Error fetching preferences:", error);
      res.status(500).json({ message: "Failed to fetch preferences" });
    }
  });

  app.patch("/api/preferences", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const currentPrefs = await storage.getUserPreferences(userId);
      
      const updatedData = {
        userId,
        defaultWpm: req.body.defaultWpm ?? currentPrefs?.defaultWpm ?? 250,
        gradualStart: req.body.gradualStart ?? currentPrefs?.gradualStart ?? true,
        pauseOnPunctuation: req.body.pauseOnPunctuation ?? currentPrefs?.pauseOnPunctuation ?? true,
        fontSize: req.body.fontSize ?? currentPrefs?.fontSize ?? 64,
      };
      
      const parsed = insertUserPreferencesSchema.safeParse(updatedData);
      
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid preferences data" });
      }
      
      const preferences = await storage.createOrUpdateUserPreferences(parsed.data);
      res.json(preferences);
    } catch (error) {
      console.error("Error updating preferences:", error);
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  app.patch("/api/account/email", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      
      const parsed = updateEmailSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: parsed.error.flatten().fieldErrors 
        });
      }

      const { newEmail, password } = parsed.data;

      const existingUser = await findUserByEmail(newEmail);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const user = await findUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid password" });
      }

      const [updatedUser] = await db
        .update(users)
        .set({ email: newEmail.toLowerCase(), updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();

      res.json({
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
      });
    } catch (error) {
      console.error("Error updating email:", error);
      res.status(500).json({ message: "Failed to update email" });
    }
  });

  app.patch("/api/account/password", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      
      const parsed = updatePasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: parsed.error.flatten().fieldErrors 
        });
      }

      const { currentPassword, newPassword } = parsed.data;

      const user = await findUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 12);

      await db
        .update(users)
        .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
        .where(eq(users.id, userId));

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).json({ message: "Failed to update password" });
    }
  });

  // Gumroad license verification
  app.post("/api/subscription/verify-license", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const { licenseKey } = req.body;

      if (!licenseKey || typeof licenseKey !== "string") {
        return res.status(400).json({ message: "License key is required" });
      }

      const productId = process.env.GUMROAD_PRODUCT_ID;
      if (!productId) {
        return res.status(500).json({ message: "Gumroad not configured" });
      }

      // Verify license with Gumroad API
      const requestBody = new URLSearchParams();
      requestBody.append("product_id", productId);
      requestBody.append("license_key", licenseKey.trim());
      requestBody.append("increment_uses_count", "false");

      const gumroadResponse = await fetch("https://api.gumroad.com/v2/licenses/verify", {
        method: "POST",
        body: requestBody,
      });

      const gumroadData = await gumroadResponse.json();

      if (!gumroadData.success) {
        return res.status(400).json({ message: "Invalid license key" });
      }

      // Check if subscription is active (not refunded, disputed, or cancelled)
      const purchase = gumroadData.purchase;
      if (purchase.refunded || purchase.disputed) {
        return res.status(400).json({ message: "This license has been refunded or disputed" });
      }

      if (purchase.subscription_cancelled_at || purchase.subscription_failed_at) {
        return res.status(400).json({ message: "This subscription has ended" });
      }

      // Update subscription to premium
      await storage.createOrUpdateSubscription({
        userId,
        tier: "premium",
        maxWpm: 1000,
      });

      // Store license info and get updated subscription
      const updatedSubscription = await storage.updateSubscriptionLicense(userId, {
        gumroadLicenseKey: licenseKey.trim(),
        gumroadProductId: productId,
        licenseEmail: purchase.email,
        licenseValidatedAt: new Date(),
      });

      res.json({
        ...updatedSubscription,
        message: "Premium subscription activated!",
      });
    } catch (error) {
      console.error("Error verifying license:", error);
      res.status(500).json({ message: "Failed to verify license" });
    }
  });

  // Remove license / downgrade to free
  app.post("/api/subscription/remove-license", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;

      const subscription = await storage.createOrUpdateSubscription({
        userId,
        tier: "free",
        maxWpm: 350,
      });

      await storage.updateSubscriptionLicense(userId, {
        gumroadLicenseKey: null,
        gumroadProductId: null,
        licenseEmail: null,
        licenseValidatedAt: null,
      });

      res.json({ ...subscription, message: "Subscription downgraded to free" });
    } catch (error) {
      console.error("Error removing license:", error);
      res.status(500).json({ message: "Failed to remove license" });
    }
  });

  return httpServer;
}
