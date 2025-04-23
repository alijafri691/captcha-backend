// api/solve.js
const fetch = require("node-fetch");

const API_KEY = process.env.TWOCAPTCHA_API_KEY;

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  const { sitekey, pageUrl } = req.body;

  try {
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
    const resultUrl = `https://2captcha.com/res.php?key=${API_KEY}&action=get&id=${captchaId}&json=1`;

    for (let i = 0; i < 24; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const resultRes = await fetch(resultUrl);
      const resultData = await resultRes.json();

      if (resultData.status === 1)
        return res.status(200).json({ token: resultData.request });

      if (resultData.request !== "CAPCHA_NOT_READY") {
        return res.status(500).json({ error: resultData.request });
      }
    }

    res.status(408).json({ error: "Captcha solve timeout" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};
