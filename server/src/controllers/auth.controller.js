import bcrypt from "bcrypt";
import { User } from "../models/User.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { clearAuthCookies, setAuthCookies } from "../utils/cookies.js";
import {
  newJti,
  sha256,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/tokens.js";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function getReqMeta(req) {
  return {
    userAgent: String(req.headers["user-agent"] || ""),
    ip: String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || ""),
  };
}

export async function register(req, res) {
  const { email, password } = req.body || {};
  const emailLower = normalizeEmail(email);

  if (!emailLower || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  const existing = await User.findOne({ emailLower });
  if (existing) return res.status(409).json({ error: "Email already registered" });

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    emailLower,
    passwordHash,
    settings: { theme: "dark", baseCurrency: "EUR", currencySymbol: "€" },
  });

  // Dont auto login just confirm creation
  return res.status(201).json({ ok: true, userId: user._id.toString() });
}

export async function login(req, res) {
  const { email, password } = req.body || {};
  const emailLower = normalizeEmail(email);

  if (!emailLower || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = await User.findOne({ emailLower });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const jti = newJti();
  const accessToken = signAccessToken({ userId: user._id.toString() });
  const refreshToken = signRefreshToken({ userId: user._id.toString(), jti });

  const { userAgent, ip } = getReqMeta(req);

  await RefreshToken.create({
    userId: user._id,
    tokenHash: sha256(refreshToken),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    revokedAt: null,
    userAgent,
    ip,
  });

  setAuthCookies(res, { accessToken, refreshToken });

  return res.json({
    ok: true,
    user: {
      email: user.emailLower,
      settings: user.settings,
    },
  });
}

export async function refresh(req, res) {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    clearAuthCookies(res);
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = payload.sub;

  // Check token exists and is not revoked
  const tokenHash = sha256(token);
  const dbToken = await RefreshToken.findOne({ tokenHash, revokedAt: null });
  if (!dbToken) {
    // Token reuse or revoked so clear cookies
    clearAuthCookies(res);
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Revoke old token, issue new one
  dbToken.revokedAt = new Date();
  await dbToken.save();

  const newTokenJti = newJti();
  const newAccessToken = signAccessToken({ userId });
  const newRefreshToken = signRefreshToken({ userId, jti: newTokenJti });

  const { userAgent, ip } = getReqMeta(req);
  await RefreshToken.create({
    userId,
    tokenHash: sha256(newRefreshToken),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    revokedAt: null,
    userAgent,
    ip,
  });

  setAuthCookies(res, { accessToken: newAccessToken, refreshToken: newRefreshToken });
  return res.json({ ok: true });
}

export async function logout(req, res) {
  const token = req.cookies?.refreshToken;

  if (token) {
    const tokenHash = sha256(token);
    await RefreshToken.updateOne(
      { tokenHash, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    ).catch(() => {});
  }

  clearAuthCookies(res);
  return res.json({ ok: true });
}
