import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import holdingsRoutes from "./routes/holdings.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import assetsRoutes from "./routes/asset.routes.js";
import pricesRoutes from "./routes/prices.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import passwordRoutes from "./routes/password.routes.js";
import priceHistoryRoutes from "./routes/pricehistory.routes.js";
import incomeRoutes from "./routes/income.routes.js";

function parseOrigins(envVal) {
  return String(envVal || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function createApp() {
  const app = express();

  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  // Hide framework signature
  app.disable("x-powered-by");

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: false, 
    })
  );

  // Body parsing limit to reduce abuse
  app.use(express.json({ limit: "200kb" }));
  app.use(cookieParser());

  // NoSQL injection + XSS input sanitization
  //app.use(mongoSanitize());
  //app.use(xss());

  // Rate limiting (global + tighter on auth)
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300, 
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.use(
    "/api/auth",
    rateLimit({
      windowMs: 10 * 60 * 1000,
      max: 40, 
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  // CORS hardening
  const allowedOrigins = parseOrigins(
    process.env.CLIENT_ORIGIN || "https://alexkav47.github.io" || "http://localhost:5173"
  );

  app.use(
    cors({
      origin(origin, cb) {
        // allow nonbrowser clients with no Origin header curl, server-to-server
        if (!origin) return cb(null, true);

        // exact match only
        if (allowedOrigins.includes(origin)) return cb(null, true);

        return cb(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
);

  app.get("/api/health", (req, res) => res.json({ ok: true }));
  app.get("/health", (req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRoutes);
  app.use("/api/user", userRoutes);
  app.use("/api/settings", settingsRoutes);
  app.use("/api/password", passwordRoutes);
  app.use("/api/holdings", holdingsRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/assets", assetsRoutes);
  app.use("/api/prices", pricesRoutes);
  app.use("/api/price-history", priceHistoryRoutes);
  app.use("/api/income", incomeRoutes);

  // Error handler 
  app.use((err, req, res, next) => {
    console.error(err);
    const status = err.statusCode || 500;

    res.status(status).json({
      error:
        process.env.NODE_ENV === "production"
          ? status === 500
            ? "Internal Server Error"
            : "Request failed"
          : err.message,
    });
  });

  return app;
}
  
