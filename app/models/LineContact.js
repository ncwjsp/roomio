import mongoose from "mongoose";
import User from "./User";

const LineContactSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    pfp: { type: String, required: false, default: "" },
    landlordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isTenant: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const LineContact =
  mongoose.models.LineContact ||
  mongoose.model("LineContact", LineContactSchema);

export default LineContact;
