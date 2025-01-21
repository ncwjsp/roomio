import mongoose from "mongoose";

const utilityUsageSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    readingDate: {
      type: Date,
      required: true,
    },
    electricityReading: {
      current: {
        type: Number,
        required: true,
      },
      previous: {
        type: Number,
        required: true,
      },
      units: {
        type: Number,
        default: function () {
          return this.current - this.previous;
        },
      },
      ratePerUnit: {
        type: Number,
        required: true,
      },
    },
    waterReading: {
      current: {
        type: Number,
        required: true,
      },
      previous: {
        type: Number,
        required: true,
      },
      units: {
        type: Number,
        default: function () {
          return this.current - this.previous;
        },
      },
      ratePerUnit: {
        type: Number,
        required: true,
      },
    },
    totalElectricityCharge: {
      type: Number,
      default: function () {
        return (
          this.electricityReading.units * this.electricityReading.ratePerUnit
        );
      },
    },
    totalWaterCharge: {
      type: Number,
      default: function () {
        return this.waterReading.units * this.waterReading.ratePerUnit;
      },
    },
    totalCharge: {
      type: Number,
      default: function () {
        return this.totalElectricityCharge + this.totalWaterCharge;
      },
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paymentDate: {
      type: Date,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for better query performance
utilityUsageSchema.index({ room: 1, readingDate: 1 });
utilityUsageSchema.index({ tenant: 1, readingDate: 1 });

// Add methods to calculate charges
utilityUsageSchema.methods.calculateCharges = function () {
  this.totalElectricityCharge =
    this.electricityReading.units * this.electricityReading.ratePerUnit;
  this.totalWaterCharge =
    this.waterReading.units * this.waterReading.ratePerUnit;
  this.totalCharge = this.totalElectricityCharge + this.totalWaterCharge;
};

const UtilityUsage =
  mongoose.models.UtilityUsage ||
  mongoose.model("UtilityUsage", utilityUsageSchema);

export default UtilityUsage;
