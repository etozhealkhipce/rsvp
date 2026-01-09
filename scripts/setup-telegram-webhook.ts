import "dotenv/config";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.VITE_APP_URL 
  ? `${process.env.VITE_APP_URL}/api/telegram-webhook`
  : null;

async function setupWebhook() {
  if (!BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN is required");
    process.exit(1);
  }

  if (!WEBHOOK_URL) {
    console.error("VITE_APP_URL is required to set webhook URL");
    process.exit(1);
  }

  console.log("Setting up Telegram webhook...");
  console.log("Webhook URL:", WEBHOOK_URL);

  // Delete old webhook
  const deleteResponse = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`
  );
  const deleteData = await deleteResponse.json();
  console.log("Delete old webhook:", deleteData.ok ? "OK" : "Failed");

  // Set new webhook
  const response = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        allowed_updates: ["message", "pre_checkout_query"],
      }),
    }
  );

  const data = await response.json();
  
  if (data.ok) {
    console.log("Webhook setup successful!");
    console.log("Description:", data.description);
  } else {
    console.error("Webhook setup failed:", data.description);
    process.exit(1);
  }

  // Get webhook info
  const infoResponse = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`
  );
  const infoData = await infoResponse.json();
  console.log("\nWebhook Info:");
  console.log("  URL:", infoData.result.url);
  console.log("  Pending updates:", infoData.result.pending_update_count);
  if (infoData.result.last_error_message) {
    console.log("  Last error:", infoData.result.last_error_message);
  }
}

setupWebhook().catch(console.error);
