import { User } from "../models/User.js";

export async function me(req, res) {
  const user = await User.findById(req.user.userId).select("emailLower settings");
  if (!user) return res.status(404).json({ error: "User not found" });

  res.json({
    ok: true,
    user: {
      email: user.emailLower,
      settings: user.settings,
    },
  });
}
