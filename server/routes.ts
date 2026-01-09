import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { storage } from "./storage";
import { insertSubscriptionSchema, insertUserPreferencesSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  app.get("/api/subscription", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.post("/api/subscription", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.get("/api/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.patch("/api/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  return httpServer;
}
