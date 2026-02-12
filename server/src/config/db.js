import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongod = null;

export async function connectDb() {
  let uri = process.env.MONGODB_URI;

  // If we are in development mode and no URI is provided
  if (process.env.NODE_ENV === "test" || !uri) {
    console.log("Local mode Starting In-Memory MongoDB");
    
    mongod = await MongoMemoryServer.create();
    uri = mongod.getUri(); 
  }

  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(uri, {
      autoIndex: true,
    });
    console.log(`Connected to MongoDB at: ${uri}`);
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

// Clean up function for when your app stops
export async function disconnectDb() {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
}