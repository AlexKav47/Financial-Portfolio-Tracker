import bcrypt from "bcryptjs";
import { User } from "../models/User.js";

export async function changePassword(req, res) {
  const userId = req.user.userId;
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "currentPassword and newPassword are required" });
  }

  if (String(newPassword).length < 8) {
    return res.status(400).json({ error: "New password must be at least 8 characters" });
  }

  const user = await User.findById(userId).select("passwordHash").lean();
  if (!user) return res.status(404).json({ error: "User not found" });

  const ok = await bcrypt.compare(String(currentPassword), user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Current password is incorrect" });

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(String(newPassword), salt);

  await User.updateOne({ _id: userId }, { $set: { passwordHash } });

  res.json({ ok: true });
}
