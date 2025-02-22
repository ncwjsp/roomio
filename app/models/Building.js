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
      required: true,
      default: 0,
    },
    electricityRate: {
      type: Number,
      required: true,
      default: 0,
    },
    billingConfig: {
      dueDate: {
        type: Number,
        required: true,
        min: 1,
        max: 15,
        default: 5,
      },
      latePaymentCharge: {
        type: Number,
        required: true,
        default: 0,
      },
    },
    housekeepers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    }],
  },
  { timestamps: true }
);

const Building =
  mongoose.models.Building || mongoose.model("Building", BuildingSchema);
export default Building;
