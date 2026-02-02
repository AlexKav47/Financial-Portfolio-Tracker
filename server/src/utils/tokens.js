import jwt from "jsonwebtoken";
import crypto from "crypto";

/**
 * Helper to get env vars with a fallback for local development
 * This prevents the server from crashing if .env lines are commented out
 */
function getEnvSecret(name, fallback) {
  const v = process.env[name];
  
  if (!v) {
    // If in production, we should still probably crash for security
    // But for your local, use the fallback
    if (process.env.NODE_ENV === "production") {
      throw new Error(`${name} missing in .env! Production requires real secrets.`);
    }
    console.warn(`⚠️ Warning: ${name} missing. Using local development fallback.`);
    return fallback;
  }
  
  return v;
}

// Provide hardcoded fallback strings that only get used if .env is empty
const ACCESS_SECRET = getEnvSecret("ACCESS_TOKEN_SECRET", "dev_access_token_secret_12345");
const REFRESH_SECRET = getEnvSecret("REFRESH_TOKEN_SECRET", "dev_refresh_token_secret_67890");

export function signAccessToken({ userId }) {
  return jwt.sign({ sub: userId }, ACCESS_SECRET, { expiresIn: "15m" });
}

export function signRefreshToken({ userId, jti }) {
  return jwt.sign({ sub: userId, jti }, REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

export function newJti() {
  return crypto.randomBytes(16).toString("hex");
}

export function sha256(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}