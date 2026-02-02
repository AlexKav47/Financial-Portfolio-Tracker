import mongoose from "mongoose";

const AssetMasterSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["stock", "crypto"], required: true, index: true },
    symbol: { type: String, required: true, index: true },
    name: { type: String, required: true },

    providerIds: {
      stooqSymbol: { type: String, default: "" },   // e.g. aapl.us
      yahooSymbol: { type: String, default: "" },   // e.g. XRP-USD 
    },
  },
  { timestamps: true }
);

AssetMasterSchema.index({ type: 1, symbol: 1 }, { unique: true });
AssetMasterSchema.index({ name: "text", symbol: "text" });

export const AssetMaster = mongoose.model("AssetMaster", AssetMasterSchema);
