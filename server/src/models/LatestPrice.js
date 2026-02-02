import mongoose from "mongoose";

const LatestPriceSchema = new mongoose.Schema(
  {
    assetRefId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AssetMaster",
      required: true,
      unique: true,
    },
    type: { type: String, enum: ["stock", "crypto"], required: true, index: true },
    symbol: { type: String, required: true, index: true },

    currency: { type: String, default: "USD" },
    price: { type: Number, required: true },
    asOf: { type: Date, required: true, index: true },
    source: { type: String, enum: ["stooq", "yahoo"], required: true },
  },
  { timestamps: true }
);

LatestPriceSchema.index({ symbol: 1, type: 1 });

export const LatestPrice = mongoose.model("LatestPrice", LatestPriceSchema);
