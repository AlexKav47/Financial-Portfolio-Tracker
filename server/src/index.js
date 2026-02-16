import "dotenv/config";
import mongoose from "mongoose";

import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import { startScheduler } from "./jobs/scheduler.js";

const PORT = Number(process.env.PORT || 4000);
const NODE_ENV = process.env.NODE_ENV || "development";
const RUN_SCHEDULER = String(process.env.RUN_SCHEDULER || "").toLowerCase() === "true";

function logStartup() {
  const clientOrigin = process.env.CLIENT_ORIGIN || "(not set)";
  const cookieSameSite = process.env.COOKIE_SAMESITE || "(default:lax)";

  console.log(`[boot] env=${NODE_ENV}`);
  console.log(`[boot] port=${PORT}`);
  console.log(`[boot] client_origin=${clientOrigin}`);
  console.log(`[boot] cookie_samesite=${cookieSameSite}`);
}

async function start() {
  try {
    logStartup();

    await connectDb();
    console.log("[boot] Database connected:", mongoose.connection.name);

    const app = createApp();

    if (RUN_SCHEDULER) {
      startScheduler();
      console.log("[boot] Scheduler started (RUN_SCHEDULER=true)");
    } else {
      console.log("[boot] Scheduler disabled (set RUN_SCHEDULER=true to enable)");
    }

    app.listen(PORT, () => {
      const baseUrl =
        NODE_ENV === "production"
          ? `port ${PORT}`
          : `http://localhost:${PORT}`;
      console.log(`[boot] Server listening on ${baseUrl}`);
    });
  } catch (err) {
    console.error("[boot] Fatal startup error:", err);
    process.exit(1);
  }
}

// Crash hard on unhandled async failures prevents zombie server state
process.on("unhandledRejection", (err) => {
  console.error("[process] unhandledRejection:", err);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("[process] uncaughtException:", err);
  process.exit(1);
});

start();
