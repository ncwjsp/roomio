import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    billingCycle: {
      startDate: {
        type: Number,
        required: true,
        min: 1,
        max: 28,
        default: 1,
      },
      endDate: {
        type: Number,
        required: true,
        min: 1,
        max: 28,
        default: 28,
      },
      dueDate: {
        type: Number,
        required: true,
        min: 1,
        max: 31,
        default: 5,
      },
    },
  },
  { timestamps: true }
);

export default mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);
