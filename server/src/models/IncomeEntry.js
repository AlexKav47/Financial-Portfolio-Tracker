import mongoose from "mongoose";

const IncomeEntrySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    type: { type: String, enum: ["dividend", "staking"], required: true, index: true },

    // Link to AssetMaster later 
    assetRefId: { type: mongoose.Schema.Types.ObjectId, ref: "AssetMaster", default: null },

    symbol: { type: String, required: true, index: true }, 
    network: { type: String, default: "" }, // Staking only 

    date: { type: Date, required: true, index: true },

    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" }, // Display/entry currency 
  },
  { timestamps: true }
);

IncomeEntrySchema.index({ userId: 1, type: 1, date: -1 });

export const IncomeEntry = mongoose.model("IncomeEntry", IncomeEntrySchema);
