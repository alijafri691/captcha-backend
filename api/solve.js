// api/solve.js
const fetch = require("node-fetch");

const API_KEY = process.env.TWOCAPTCHA_API_KEY;

module.exports = async (req, res) => {
  // CORS Headers
  const allowedOrigins = ["https://smartapply.indeed.com"];
  if (allowedOrigins.includes(req.headers.origin)) {
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.status(200).end(); // Preflight
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  const { sitekey, pageUrl } = req.body;

  if (!sitekey || !pageUrl) {
    return res.status(400).json({ error: "Missing sitekey or pageUrl" });
  }

  try {
    // Step 1: Submit CAPTCHA task
    const formData = new URLSearchParams({
      key: API_KEY,
      method: "userrecaptcha",
      googlekey: sitekey,
      pageurl: pageUrl,
      enterprise: "1",
      json: "1",
    });

    const submitRes = await fetch("https://2captcha.com/in.php", {
      method: "POST",
      body: formData,
    });

    const submitData = await submitRes.json();
    if (submitData.status !== 1)
      return res.status(500).json({ error: "Failed to submit captcha" });

    const captchaId = submitData.request;

    // Step 2: Poll for result
    const resultUrl = `https://2captcha.com/res.php?key=${API_KEY}&action=get&id=${captchaId}&json=1`;

    for (let i = 0; i < 24; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const resultRes = await fetch(resultUrl);
      const resultData = await resultRes.json();

      if (resultData.status === 1) {
        return res.status(200).json({ token: resultData.request });
      }

      if (resultData.request !== "CAPCHA_NOT_READY") {
        return res.status(500).json({ error: resultData.request });
      }
    }

    return res.status(408).json({ error: "Captcha solve timeout" });
  } catch (err) {
    console.error("Error solving CAPTCHA:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
