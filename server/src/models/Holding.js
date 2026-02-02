import mongoose from "mongoose";

const HoldingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // reference to assetsMaster
    assetRefId: { type: mongoose.Schema.Types.ObjectId, ref: "AssetMaster", default: null, index: true },

    type: { type: String, enum: ["stock", "crypto"], required: true },
    symbol: { type: String, required: true },
    name: { type: String, default: "" },

    quantity: { type: Number, required: true },
    avgBuyPrice: { type: Number, required: true },
  },
  { timestamps: true }
);

HoldingSchema.index({ userId: 1, type: 1 });
HoldingSchema.index({ userId: 1, symbol: 1 });

export const Holding = mongoose.model("Holding", HoldingSchema);
