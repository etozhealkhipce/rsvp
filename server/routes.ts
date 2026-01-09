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
        sameSite: "lax",
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

  // Generate secure token for Telegram linking
  app.post("/api/subscription/generate-telegram-token", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      
      // Ensure subscription exists
      let subscription = await storage.getSubscription(userId);
      if (!subscription) {
        subscription = await storage.createOrUpdateSubscription({
          userId,
          tier: "free",
          maxWpm: 350,
        });
      }

      // Generate a signed token: base64(userId:timestamp:hash)
      // Uses TELEGRAM_TOKEN_SECRET (dedicated) or falls back to SESSION_SECRET
      const timestamp = Date.now();
      const secret = process.env.TELEGRAM_TOKEN_SECRET || process.env.SESSION_SECRET || "fallback-secret";
      const payload = `${userId}:${timestamp}`;
      const hash = Buffer.from(
        await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload + secret))
      ).toString("base64").substring(0, 16);
      
      const token = Buffer.from(`${payload}:${hash}`).toString("base64url");
      
      res.json({ token, subscription });
    } catch (error) {
      console.error("Error generating token:", error);
      res.status(500).json({ message: "Failed to generate token" });
    }
  });

  // Telegram webhook for bot updates and payments
  app.post("/api/telegram-webhook", async (req: Request, res: Response) => {
    try {
      const update = req.body;
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
      const tokenSecret = process.env.TELEGRAM_TOKEN_SECRET || process.env.SESSION_SECRET || "fallback-secret";
      const starsPrice = parseInt(process.env.TELEGRAM_STARS_PRICE || "100", 10);

      if (!botToken) {
        console.error("TELEGRAM_BOT_TOKEN not configured");
        return res.json({ ok: true });
      }
      
      // Verify webhook authenticity using Telegram's secret_token header
      // This prevents forged requests from attackers
      if (webhookSecret) {
        const receivedSecret = req.headers["x-telegram-bot-api-secret-token"];
        if (receivedSecret !== webhookSecret) {
          console.error("Telegram webhook: Invalid secret token");
          return res.status(401).json({ error: "Unauthorized" });
        }
      } else {
        console.warn("TELEGRAM_WEBHOOK_SECRET not set - webhook requests are not verified");
      }

      // Handle /start command - link account with secure token
      if (update.message?.text?.startsWith("/start")) {
        const chatId = update.message.chat.id;
        const telegramUserId = update.message.from.id.toString();
        const args = update.message.text.split(" ");
        
        if (args.length > 1) {
          const token = args[1];
          
          // Verify token
          try {
            const decoded = Buffer.from(token, "base64url").toString();
            const [userId, timestamp, hash] = decoded.split(":");
            
            // Check token age (valid for 1 hour)
            const tokenAge = Date.now() - parseInt(timestamp, 10);
            if (tokenAge > 3600000) {
              await sendTelegramMessage(botToken, chatId, "Link expired. Please get a new link from the website.");
              return res.json({ ok: true });
            }
            
            // Verify hash
            const expectedPayload = `${userId}:${timestamp}`;
            const expectedHashBuffer = await crypto.subtle.digest(
              "SHA-256", 
              new TextEncoder().encode(expectedPayload + tokenSecret)
            );
            const expectedHash = Buffer.from(expectedHashBuffer).toString("base64").substring(0, 16);
            
            if (hash !== expectedHash) {
              await sendTelegramMessage(botToken, chatId, "Invalid link. Please get a new link from the website.");
              return res.json({ ok: true });
            }

            // Check if Telegram ID is already linked to another account
            const existingSub = await storage.getSubscriptionByTelegramId(telegramUserId);
            if (existingSub && existingSub.userId !== userId) {
              await sendTelegramMessage(
                botToken, 
                chatId, 
                "This Telegram account is already linked to another RSVP Reader account."
              );
              return res.json({ ok: true });
            }

            // Get subscription
            let subscription = await storage.getSubscription(userId);
            if (!subscription) {
              subscription = await storage.createOrUpdateSubscription({
                userId,
                tier: "free",
                maxWpm: 350,
              });
            }

            // Link Telegram account
            try {
              await storage.linkTelegramAccount(userId, telegramUserId);
            } catch (linkError: any) {
              if (linkError.message.includes("already linked")) {
                await sendTelegramMessage(botToken, chatId, linkError.message);
                return res.json({ ok: true });
              }
              throw linkError;
            }
            
            if (subscription.tier === "premium") {
              await sendTelegramMessage(botToken, chatId, "Your account is already Premium! Return to the app to continue reading.");
            } else {
              await sendPaymentInvoice(botToken, chatId, telegramUserId, userId);
            }
          } catch (e: any) {
            console.error("Token verification error:", e);
            await sendTelegramMessage(botToken, chatId, "Invalid link. Please get a new link from the website.");
          }
        } else {
          await sendTelegramMessage(botToken, chatId, "Welcome! Please use the 'Buy Premium' button on the RSVP Reader website to start.");
        }
        
        return res.json({ ok: true });
      }

      // Handle pre-checkout query (approve payment with validation)
      if (update.pre_checkout_query) {
        const queryId = update.pre_checkout_query.id;
        const payload = update.pre_checkout_query.invoice_payload;
        
        try {
          const parsedPayload = JSON.parse(payload);
          const telegramUserId = update.pre_checkout_query.from.id.toString();
          
          // Verify telegram user matches payload
          if (parsedPayload.telegramUserId !== telegramUserId) {
            await fetch(`https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                pre_checkout_query_id: queryId,
                ok: false,
                error_message: "User mismatch. Please restart the payment process.",
              }),
            });
            return res.json({ ok: true });
          }
          
          // Verify price matches
          if (update.pre_checkout_query.total_amount !== starsPrice) {
            await fetch(`https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                pre_checkout_query_id: queryId,
                ok: false,
                error_message: "Price mismatch. Please restart the payment process.",
              }),
            });
            return res.json({ ok: true });
          }

          // Approve payment
          await fetch(`https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pre_checkout_query_id: queryId,
              ok: true,
            }),
          });
        } catch (e) {
          await fetch(`https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pre_checkout_query_id: queryId,
              ok: false,
              error_message: "Invalid payment data.",
            }),
          });
        }
        
        return res.json({ ok: true });
      }

      // Handle successful payment
      if (update.message?.successful_payment) {
        const payment = update.message.successful_payment;
        const telegramUserId = update.message.from.id.toString();
        const chatId = update.message.chat.id;
        const chargeId = payment.telegram_payment_charge_id;

        // Verify payment data
        try {
          const parsedPayload = JSON.parse(payment.invoice_payload);
          
          // Verify telegram user matches
          if (parsedPayload.telegramUserId !== telegramUserId) {
            console.error("Payment user mismatch:", { payload: parsedPayload, telegramUserId });
            return res.json({ ok: true });
          }

          // Activate premium
          const subscription = await storage.activatePremiumByTelegram(telegramUserId, {
            telegramUserId,
            telegramPaymentChargeId: chargeId,
            paidAt: new Date(),
          });

          if (subscription) {
            await sendTelegramMessage(
              botToken,
              chatId,
              `Payment successful! Your Premium subscription is now active.\n\nYou can now read at speeds up to 1000 WPM. Return to the RSVP Reader app to enjoy your premium features!`
            );
          } else {
            await sendTelegramMessage(
              botToken,
              chatId,
              "Payment received, but there was an issue activating your subscription. Please contact support."
            );
          }
        } catch (e) {
          console.error("Payment processing error:", e);
        }
        
        return res.json({ ok: true });
      }

      res.json({ ok: true });
    } catch (error) {
      console.error("Telegram webhook error:", error);
      res.json({ ok: true });
    }
  });

  return httpServer;
}

// Helper functions for Telegram API
async function sendTelegramMessage(botToken: string, chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
    }),
  });
}

async function sendPaymentInvoice(botToken: string, chatId: number, telegramUserId: string, userId: string) {
  const starsPrice = parseInt(process.env.TELEGRAM_STARS_PRICE || "100", 10);
  
  await fetch(`https://api.telegram.org/bot${botToken}/sendInvoice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      title: "RSVP Reader Premium",
      description: "Unlock reading speeds up to 1000 WPM and all premium features",
      payload: JSON.stringify({ telegramUserId, userId, timestamp: Date.now() }),
      currency: "XTR",
      prices: [{ label: "Premium", amount: starsPrice }],
      provider_token: "",
    }),
  });
}
