import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import {
  setupAuthRoutes,
  requireAuth,
  findUserById,
  findUserByEmail,
} from "./auth";
import { storage } from "./storage";
import {
  insertSubscriptionSchema,
  insertUserPreferencesSchema,
  users,
} from "@shared/schema";
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
  app: Express,
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
    }),
  );

  const authRouter = setupAuthRoutes();
  app.use("/api/auth", authRouter);

  app.get(
    "/api/subscription",
    requireAuth,
    async (req: Request, res: Response) => {
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
    },
  );

  app.post(
    "/api/subscription",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const userId = req.session.userId!;
        const parsed = insertSubscriptionSchema.safeParse({
          ...req.body,
          userId,
        });

        if (!parsed.success) {
          return res.status(400).json({ message: "Invalid subscription data" });
        }

        const subscription = await storage.createOrUpdateSubscription(
          parsed.data,
        );
        res.json(subscription);
      } catch (error) {
        console.error("Error updating subscription:", error);
        res.status(500).json({ message: "Failed to update subscription" });
      }
    },
  );

  app.get(
    "/api/preferences",
    requireAuth,
    async (req: Request, res: Response) => {
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
    },
  );

  app.patch(
    "/api/preferences",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const userId = req.session.userId!;
        const currentPrefs = await storage.getUserPreferences(userId);

        const updatedData = {
          userId,
          defaultWpm: req.body.defaultWpm ?? currentPrefs?.defaultWpm ?? 250,
          gradualStart:
            req.body.gradualStart ?? currentPrefs?.gradualStart ?? true,
          pauseOnPunctuation:
            req.body.pauseOnPunctuation ??
            currentPrefs?.pauseOnPunctuation ??
            true,
          fontSize: req.body.fontSize ?? currentPrefs?.fontSize ?? 64,
        };

        const parsed = insertUserPreferencesSchema.safeParse(updatedData);

        if (!parsed.success) {
          return res.status(400).json({ message: "Invalid preferences data" });
        }

        const preferences = await storage.createOrUpdateUserPreferences(
          parsed.data,
        );
        res.json(preferences);
      } catch (error) {
        console.error("Error updating preferences:", error);
        res.status(500).json({ message: "Failed to update preferences" });
      }
    },
  );

  app.patch(
    "/api/account/email",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const userId = req.session.userId!;

        const parsed = updateEmailSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors,
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
    },
  );

  app.patch(
    "/api/account/password",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const userId = req.session.userId!;

        const parsed = updatePasswordSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors,
          });
        }

        const { currentPassword, newPassword } = parsed.data;

        const user = await findUserById(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const isValid = await bcrypt.compare(
          currentPassword,
          user.passwordHash,
        );
        if (!isValid) {
          return res
            .status(401)
            .json({ message: "Current password is incorrect" });
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
    },
  );

  // Generate secure token for Telegram linking
  app.post(
    "/api/subscription/generate-telegram-token",
    requireAuth,
    async (req: Request, res: Response) => {
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

        // Generate a short token stored in database (12 chars, fits Telegram's 64 char limit)
        const token = await storage.createTelegramLinkToken(userId);

        res.json({ token, subscription });
      } catch (error) {
        console.error("Error generating token:", error);
        res.status(500).json({ message: "Failed to generate token" });
      }
    },
  );

  // Telegram webhook for bot updates and payments
  app.post("/api/telegram-webhook", async (req: Request, res: Response) => {
    try {
      const update = req.body;
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
      const starsPrice = parseInt(process.env.TELEGRAM_STARS_PRICE || "1", 10);

      if (!botToken) {
        console.error("TELEGRAM_BOT_TOKEN not configured");
        return res.json({ ok: true });
      }

      // Log incoming webhook for debugging
      console.log(
        "Telegram webhook received:",
        JSON.stringify(update).substring(0, 500),
      );
      console.log("Update type:", update.message ? "message" : update.pre_checkout_query ? "pre_checkout" : update.successful_payment ? "payment" : "unknown");

      // Simple echo for debugging - remove after testing
      if (update.message?.text && !update.message.text.startsWith("/")) {
        await sendTelegramMessage(botToken, update.message.chat.id, `Echo: ${update.message.text}`);
      }

      // Verify webhook authenticity using Telegram's secret_token header
      if (webhookSecret) {
        const receivedSecret = req.headers["x-telegram-bot-api-secret-token"];
        if (receivedSecret !== webhookSecret) {
          console.warn(
            "Telegram webhook: Secret token mismatch or missing (header:",
            receivedSecret ? "present" : "missing",
            ")",
          );
        }
      }

      // Expire old pending payments periodically
      try {
        await storage.expireOldPayments();
      } catch (expireError) {
        console.error("Error expiring old payments (non-fatal):", expireError);
      }

      // Handle /history command - show payment history
      if (update.message?.text === "/history") {
        const chatId = update.message.chat.id;
        const telegramUserId = update.message.from.id.toString();
        
        await handleHistoryCommand(botToken, chatId, telegramUserId);
        return res.json({ ok: true });
      }

      // Handle /start command - link account with secure token
      if (update.message?.text?.startsWith("/start")) {
        const chatId = update.message.chat.id;
        const telegramUserId = update.message.from.id.toString();
        const args = update.message.text.split(" ");

        if (args.length > 1) {
          const tokenId = args[1];
          console.log(
            "Processing /start with token:",
            tokenId,
            "chatId:",
            chatId,
            "telegramUserId:",
            telegramUserId,
          );

          // Look up token in database
          let linkToken;
          try {
            linkToken = await storage.getTelegramLinkToken(tokenId);
            console.log("Token lookup result:", linkToken ? "found" : "not found");
          } catch (tokenError) {
            console.error("Error looking up token:", tokenError);
            await sendTelegramMessage(
              botToken,
              chatId,
              "Error processing your request. Please try again.",
            );
            return res.json({ ok: true });
          }

          if (!linkToken) {
            console.log("Token not found or expired, sending error message");
            await sendTelegramMessage(
              botToken,
              chatId,
              "Link expired or invalid. Please get a new link from the website (links expire in 1 minute).",
            );
            return res.json({ ok: true });
          }

          const userId = linkToken.userId;
          console.log("Token valid for userId:", userId);

          // Delete token after use (one-time use)
          await storage.deleteTelegramLinkToken(tokenId);

          // Get or create subscription
          let subscription = await storage.getSubscription(userId);
          if (!subscription) {
            subscription = await storage.createOrUpdateSubscription({
              userId,
              tier: "free",
              maxWpm: 350,
            });
          }

          // Get user email for display
          const user = await findUserById(userId);
          const userEmail = user?.email || "Unknown";

          // Link Telegram account (now allows multiple app accounts per TG user)
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
            await sendTelegramMessage(
              botToken,
              chatId,
              `Account *${userEmail}* is already Premium! Return to the app to continue reading.`,
            );
          } else {
            // Create pending payment record with 1-minute expiry
            const expiresAt = new Date(Date.now() + 60000); // 1 minute
            const payment = await storage.createTelegramPayment({
              telegramUserId,
              telegramChatId: chatId.toString(),
              userId,
              userEmail,
              amount: starsPrice,
              expiresAt,
            });

            await sendPaymentInvoice(botToken, chatId, telegramUserId, userId, payment.id, userEmail, starsPrice);
          }
        } else {
          await sendTelegramMessage(
            botToken,
            chatId,
            "Welcome to RSVP Reader!\n\nUse the 'Buy Premium' button on the website to link your account.\n\nCommands:\n/history - View your payment history and accounts",
          );
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
          const paymentId = parsedPayload.paymentId;

          // Verify telegram user matches payload
          if (parsedPayload.telegramUserId !== telegramUserId) {
            await answerPreCheckout(botToken, queryId, false, "User mismatch. Please restart the payment process.");
            return res.json({ ok: true });
          }

          // Verify price matches
          if (update.pre_checkout_query.total_amount !== starsPrice) {
            await answerPreCheckout(botToken, queryId, false, "Price mismatch. Please restart the payment process.");
            return res.json({ ok: true });
          }

          // Check if payment record exists and is valid
          const pendingPayment = await storage.getTelegramPayment(paymentId);
          
          if (!pendingPayment) {
            await answerPreCheckout(botToken, queryId, false, "Payment not found. Please get a new invoice from the website.");
            return res.json({ ok: true });
          }

          if (pendingPayment.status !== "pending") {
            await answerPreCheckout(botToken, queryId, false, "This invoice has already been processed or expired.");
            return res.json({ ok: true });
          }

          // Check if invoice expired (1 minute)
          if (new Date() > new Date(pendingPayment.expiresAt)) {
            await storage.markPaymentExpired(paymentId);
            await answerPreCheckout(botToken, queryId, false, "Invoice expired. Please get a new one from the website.");
            return res.json({ ok: true });
          }

          // Approve payment
          await answerPreCheckout(botToken, queryId, true);
        } catch (e) {
          console.error("Pre-checkout error:", e);
          await answerPreCheckout(botToken, queryId, false, "Invalid payment data.");
        }

        return res.json({ ok: true });
      }

      // Handle successful payment
      if (update.message?.successful_payment) {
        const payment = update.message.successful_payment;
        const telegramUserId = update.message.from.id.toString();
        const chatId = update.message.chat.id;
        const chargeId = payment.telegram_payment_charge_id;

        try {
          const parsedPayload = JSON.parse(payment.invoice_payload);
          const paymentId = parsedPayload.paymentId;
          const userId = parsedPayload.userId;

          // Verify telegram user matches
          if (parsedPayload.telegramUserId !== telegramUserId) {
            console.error("Payment user mismatch:", { payload: parsedPayload, telegramUserId });
            return res.json({ ok: true });
          }

          // Mark payment as paid (with unique chargeId to prevent double processing)
          const paidPayment = await storage.markPaymentPaid(paymentId, chargeId);
          
          if (!paidPayment) {
            console.error("Failed to mark payment as paid:", paymentId);
            await sendTelegramMessage(
              botToken,
              chatId,
              "Payment received, but there was an issue processing. Please contact support.",
            );
            return res.json({ ok: true });
          }

          // Activate premium using userId (not telegramUserId)
          const subscription = await storage.activatePremiumByUserId(userId, {
            telegramUserId,
            telegramPaymentChargeId: chargeId,
            paidAt: new Date(),
          });

          if (subscription) {
            const user = await findUserById(userId);
            await sendTelegramMessage(
              botToken,
              chatId,
              `Payment successful! Premium activated for *${user?.email || "your account"}*.\n\nYou can now read at speeds up to 1000 WPM. Return to the app to enjoy your premium features!\n\nUse /history to see all your accounts.`,
            );
          } else {
            await sendTelegramMessage(
              botToken,
              chatId,
              "Payment received, but there was an issue activating your subscription. Please contact support.",
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

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  return httpServer;
}

// Helper functions for Telegram API
async function sendTelegramMessage(
  botToken: string,
  chatId: number,
  text: string,
) {
  try {
    console.log("Sending Telegram message to chat:", chatId);
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
      }),
    });
    const result = await response.json();
    if (!result.ok) {
      console.error("Failed to send Telegram message:", result);
    } else {
      console.log("Telegram message sent successfully");
    }
  } catch (e) {
    console.error("Error sending Telegram message:", e);
  }
}

async function answerPreCheckout(
  botToken: string,
  queryId: string,
  ok: boolean,
  errorMessage?: string,
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pre_checkout_query_id: queryId,
          ok,
          ...(errorMessage && { error_message: errorMessage }),
        }),
      },
    );
    const result = await response.json();
    return result.ok === true;
  } catch (e) {
    console.error("Failed to answer pre-checkout:", e);
    return false;
  }
}

async function handleHistoryCommand(
  botToken: string,
  chatId: number,
  telegramUserId: string,
) {
  try {
    // Get payment history and subscriptions in parallel
    const [payments, linkedSubscriptions] = await Promise.all([
      storage.getPaymentHistory(telegramUserId),
      storage.getSubscriptionsByTelegramId(telegramUserId),
    ]);
    
    // Batch fetch all user emails
    const userIds = linkedSubscriptions.map(s => s.userId);
    const userEmails = new Map<string, string>();
    
    // Fetch users in parallel (limited batch)
    const userPromises = userIds.slice(0, 10).map(async (userId) => {
      const user = await findUserById(userId);
      if (user) userEmails.set(userId, user.email);
    });
    await Promise.all(userPromises);
    
    let message = "*Your RSVP Reader Accounts*\n\n";
    
    if (linkedSubscriptions.length === 0) {
      message += "No accounts linked yet. Use the website to link your account.\n\n";
    } else {
      message += "*Linked Accounts:*\n";
      for (const sub of linkedSubscriptions.slice(0, 10)) {
        const status = sub.tier === "premium" ? "Premium" : "Free";
        const email = userEmails.get(sub.userId) || "Unknown";
        message += `• ${email} - ${status}\n`;
      }
      message += "\n";
    }
    
    if (payments.length === 0) {
      message += "*Payment History:*\nNo payments yet.";
    } else {
      message += "*Recent Payments:*\n";
      for (const payment of payments.slice(0, 5)) {
        const date = payment.paidAt 
          ? new Date(payment.paidAt).toLocaleDateString() 
          : new Date(payment.createdAt!).toLocaleDateString();
        const statusIcon = payment.status === "paid" ? "✓" : payment.status === "expired" ? "✗" : "⏳";
        message += `${statusIcon} ${payment.userEmail || "Unknown"} - ${payment.amount} Stars - ${payment.status} (${date})\n`;
      }
    }
    
    await sendTelegramMessage(botToken, chatId, message);
  } catch (e) {
    console.error("Error handling /history command:", e);
    await sendTelegramMessage(botToken, chatId, "Sorry, there was an error fetching your history. Please try again later.");
  }
}

async function sendPaymentInvoice(
  botToken: string,
  chatId: number,
  telegramUserId: string,
  userId: string,
  paymentId: string,
  userEmail: string,
  starsPrice: number,
) {
  console.log(
    "Sending payment invoice to chatId:",
    chatId,
    "price:",
    starsPrice,
    "Stars",
    "paymentId:",
    paymentId,
  );

  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendInvoice`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        title: "RSVP Reader Premium",
        description: `Upgrade ${userEmail} to Premium - Read at up to 1000 WPM. This invoice expires in 1 minute.`,
        payload: JSON.stringify({
          telegramUserId,
          userId,
          paymentId,
          timestamp: Date.now(),
        }),
        currency: "XTR",
        prices: [{ label: "Premium", amount: starsPrice }],
        provider_token: "",
      }),
    },
  );

  const result = await response.json();
  console.log("sendInvoice response:", JSON.stringify(result));

  if (!result.ok) {
    console.error("Failed to send invoice:", result.description);
  }
}
