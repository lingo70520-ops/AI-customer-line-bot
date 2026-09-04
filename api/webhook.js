const crypto = require("crypto");

module.exports = async function handler(req, res) {
  // 瀏覽器測試
  if (req.method === "GET") {
    return res.status(200).json({
      status: "ok",
      message: "AI Customer LINE Bot is running"
    });
  }

  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!channelSecret || !channelAccessToken) {
    return res.status(500).send("LINE environment variables are missing");
  }

  try {
    // 取得 LINE 傳來的原始資料
    const chunks = [];

    for await (const chunk of req) {
      chunks.push(chunk);
    }

    const rawBody = Buffer.concat(chunks);
    const signature = req.headers["x-line-signature"];

    // 驗證 LINE Webhook 簽章
    const expectedSignature = crypto
      .createHmac("SHA256", channelSecret)
      .update(rawBody)
      .digest("base64");

    if (signature !== expectedSignature) {
      return res.status(401).send("Invalid signature");
    }

    const body = JSON.parse(rawBody.toString("utf8"));
    const events = body.events || [];

    for (const event of events) {
      if (
        event.type === "message" &&
        event.message &&
        event.message.type === "text"
      ) {
        const userMessage = event.message.text;

        let replyText = "您好！我是 AI 智慧客戶維繫服務 Demo 🤖";

        if (userMessage.toLowerCase() === "hello") {
          replyText =
            ""您好！我是 AI 智慧客戶維繫服務 Demo 🤖 很高興為您服務！\n\n我是邱于紋的 AI，這次分享的作品是「AI 智慧客戶維繫服務」。這個系統透過 AI 整理客戶資料與互動狀態，提供個人化的客戶維繫建議，協助提升工作效率與服務品質。";！";
        }

        await fetch("https://api.line.me/v2/bot/message/reply", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${channelAccessToken}`
          },
          body: JSON.stringify({
            replyToken: event.replyToken,
            messages: [
              {
                type: "text",
                text: replyText
              }
            ]
          })
        });
      }
    }

    return res.status(200).send("OK");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Webhook error");
  }
};
