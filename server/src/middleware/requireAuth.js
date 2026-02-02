import { verifyAccessToken } from "../utils/tokens.js";

export function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.accessToken;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const payload = verifyAccessToken(token);
    req.user = { userId: payload.sub };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}
