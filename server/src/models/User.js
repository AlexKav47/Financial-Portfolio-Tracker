import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    emailLower: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true 
    },
    passwordHash: { type: String, required: true },
    settings: {
      theme: { type: String, enum: ["light", "dark"], default: "light" },
      currency: { type: String, default: "EUR" },
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", UserSchema);



