import mongoose from "mongoose";

const IncomeEntrySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    type: { type: String, enum: ["dividend", "staking"], required: true, index: true },

    // Optional link to AssetMaster later (nice-to-have)
    assetRefId: { type: mongoose.Schema.Types.ObjectId, ref: "AssetMaster", default: null },

    symbol: { type: String, required: true, index: true }, // e.g. AAPL, VUSA, ETH
    network: { type: String, default: "" }, // staking only (Coinbase/Lido/etc.)

    date: { type: Date, required: true, index: true },

    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" }, // display/entry currency (no FX conversion)
  },
  { timestamps: true }
);

IncomeEntrySchema.index({ userId: 1, type: 1, date: -1 });

export const IncomeEntry = mongoose.model("IncomeEntry", IncomeEntrySchema);
