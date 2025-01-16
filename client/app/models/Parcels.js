import mongoose from "mongoose";

const ParcelSchema = new mongoose.Schema(
  {
    roomNo: { type: String, required: true },
    name: { type: String, required: true },
    trackingNumber: { type: String, required: true, unique: true },
    building: { type: String, required: true },
    status: { type: String, enum: ["haven't collected", "collected"], default: "haven't collected" },
  },
  { timestamps: true }
);

export default mongoose.models.Parcel || mongoose.model("Parcel", ParcelSchema);
