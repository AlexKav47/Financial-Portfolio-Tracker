import { User } from "../models/User.js";

export async function getMySettings(req, res) {
  const userId = req.user.userId;

  const user = await User.findById(userId).select("settings email").lean();
  if (!user) return res.status(404).json({ error: "User not found" });

  res.json({
    ok: true,
    settings: user.settings || { theme: "light", currency: "EUR" },
    email: user.email,
  });
}

export async function updateMySettings(req, res) {
  const userId = req.user.userId;

  const theme = req.body?.theme;
  const currency = req.body?.currency;

  const patch = {};
  if (theme != null) {
    if (!["light", "dark"].includes(theme)) {
      return res.status(400).json({ error: "Invalid theme" });
    }
    patch["settings.theme"] = theme;
  }

  if (currency != null) {
    // Accept 3-letter codes
    const c = String(currency).trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(c)) return res.status(400).json({ error: "Invalid currency" });
    patch["settings.currency"] = c;
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: patch },
    { new: true }
  ).select("settings").lean();

  res.json({ ok: true, settings: user.settings });
}
