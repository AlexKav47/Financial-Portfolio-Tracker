import mongoose from "mongoose";

const PriceHistorySchema = new mongoose.Schema(
  {
    assetRefId: { type: mongoose.Schema.Types.ObjectId, ref: "AssetMaster", required: true, index: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    type: { type: String, required: true },
    symbol: { type: String, required: true },
    source: { type: String, required: true },
    currency: { type: String, default: "USD" },

    open: { type: Number, default: null },
    high: { type: Number, default: null },
    low: { type: Number, default: null },
    close: { type: Number, required: true },
    volume: { type: Number, default: null },
  },
  { timestamps: true }
);

// Prevent duplicates and makes upsert fast
PriceHistorySchema.index({ assetRefId: 1, date: 1 }, { unique: true });

// Helps pruning by date range and sorting
PriceHistorySchema.index({ assetRefId: 1, date: -1 });

export const PriceHistory = mongoose.model("PriceHistory", PriceHistorySchema);
