import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
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


export function createApp() {
  const app = express();

  const origin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
  app.use(
    cors({
      origin,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.use(express.json());
  app.use(cookieParser());

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


  // Basic error handler
  app.use((err, req, res, next) => {
    console.error(err);
    const status = err.statusCode || 500;
    res.status(status).json({
      error: status === 500 ? "Internal Server Error" : err.message,
    });
  });

  return app;
}
