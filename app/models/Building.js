import mongoose from "mongoose";

const BuildingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    floors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Floor",
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    waterRate: {
      type: Number,
      default: 0,
    },
    electricityRate: {
      type: Number,
      default: 0,
    },
    billingConfig: {
      dueDays: {
        type: Number,
        required: true,
        min: 1,
        max: 30,
        default: 10,
      },
      latePaymentCharge: {
        type: Number,
        default: 0,
        min: 0,
      },
      latePaymentChargeType: {
        type: String,
        enum: ["fixed", "percentage"],
        default: "fixed",
      },
      partialBillingEnabled: {
        type: Boolean,
        default: false,
      },
    },
  },
  { timestamps: true }
);

const Building =
  mongoose.models.Building || mongoose.model("Building", BuildingSchema);
export default Building;
