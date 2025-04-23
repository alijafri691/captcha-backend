const fetch = require("node-fetch");

const API_KEY = process.env.TWOCAPTCHA_API_KEY;

module.exports = async (req, res) => {
  const captchaId = req.query.captchaId;
  if (!captchaId) return res.status(400).json({ error: "Missing captchaId" });

  try {
    const resultUrl = `https://2captcha.com/res.php?key=${API_KEY}&action=get&id=${captchaId}&json=1`;
    const resultRes = await fetch(resultUrl);
    const resultData = await resultRes.json();

    if (resultData.status === 1) {
      return res.status(200).json({ token: resultData.request });
    }

    return res.status(200).json({ status: resultData.request }); // "CAPCHA_NOT_READY"
  } catch (err) {
    return res.status(500).json({ error: "Check failed" });
  }
};
