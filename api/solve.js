const fetch = require("node-fetch");

const API_KEY = process.env.TWOCAPTCHA_API_KEY;

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Only POST allowed" });

  const { sitekey, pageUrl } = req.body;
  const formData = new URLSearchParams({
    key: API_KEY,
    method: "userrecaptcha",
    googlekey: sitekey,
    pageurl: pageUrl,
    enterprise: "1",
    json: "1",
  });

  try {
    const response = await fetch("https://2captcha.com/in.php", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (data.status !== 1)
      return res.status(500).json({ error: "Failed to submit captcha" });

    return res.status(200).json({ captchaId: data.request });
  } catch (err) {
    console.error("CAPTCHA error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
