import "dotenv/config";

import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import { startScheduler } from "./jobs/scheduler.js";

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await connectDb();
    console.log("Database connected successfully");

    const app = createApp();

    // Start daily refresh job
    startScheduler();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Fatal startup error:", err);
    process.exit(1);
  }
}

start();