import mongoose from "mongoose";

const PriceHistorySchema = new mongoose.Schema(
  {
    assetRefId: { type: mongoose.Schema.Types.ObjectId, ref: "AssetMaster", required: true, index: true },
    type: { type: String, enum: ["stock", "crypto"], required: true, index: true },
    symbol: { type: String, required: true, index: true },

    // daily granularity
    date: { type: String, required: true, index: true }, // YYYY-MM-DD

    // normalized fields
    open: { type: Number, default: null },
    high: { type: Number, default: null },
    low: { type: Number, default: null },
    close: { type: Number, required: true },
    volume: { type: Number, default: null },

    currency: { type: String, default: "USD" },
    source: { type: String, enum: ["stooq", "Yahoo"], required: true },
  },
  { timestamps: true }
);

// prevent duplicates per day
PriceHistorySchema.index({ assetRefId: 1, date: 1 }, { unique: true });

export const PriceHistory = mongoose.model("PriceHistory", PriceHistorySchema);
