import cron from "node-cron";
import { refreshOwnedAssetsBatch } from "../services/marketData/refresh.job.js";

let isRunning = false;

async function runOnce() {
  if (isRunning) return;
  isRunning = true;

  try {
    console.log("[batch-refresh] starting...");
    const r = await refreshOwnedAssetsBatch({ sleepMs: 1000 });
    console.log("[batch-refresh] done:", r);
  } catch (e) {
    console.error("[batch-refresh] crash:", e);
  } finally {
    isRunning = false;
  }
}

export function startScheduler() {
  // run once whenever server comes up
  runOnce();

  // midnight daily (server local time)
  cron.schedule("0 0 * * *", () => runOnce());
}
