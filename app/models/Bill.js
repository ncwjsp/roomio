import mongoose from "mongoose";

const billSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
    },
    buildingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
    },
    month: {
      type: Date,
      required: true,
    },
    waterUsage: {
      type: Number,
      default: 0,
    },
    electricityUsage: {
      type: Number,
      default: 0,
    },
    rentAmount: {
      type: Number,
      required: true,
      default: 0,
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
    waterAmount: {
      type: Number,
      default: 0,
    },
    electricityAmount: {
      type: Number,
      default: 0,
    },
    additionalFees: [
      {
        name: String,
        price: Number,
      },
    ],
    totalAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    dueDate: {
      type: Date,
    },
    notes: {
      type: String,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware
billSchema.pre("save", function (next) {
  this.calculateAmounts();
  next();
});

// Pre-update middleware
billSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update) {
    const waterUsage = Number(update.waterUsage) || 0;
    const waterRate = Number(update.waterRate) || 0;
    const electricityUsage = Number(update.electricityUsage) || 0;
    const electricityRate = Number(update.electricityRate) || 0;
    const rentAmount = Number(update.rentAmount) || 0;

    update.waterAmount = waterUsage * waterRate;
    update.electricityAmount = electricityUsage * electricityRate;

    const additionalFeesTotal = Array.isArray(update.additionalFees)
      ? update.additionalFees.reduce(
          (sum, fee) => sum + (Number(fee.price) || 0),
          0
        )
      : 0;

    update.totalAmount =
      rentAmount +
      update.waterAmount +
      update.electricityAmount +
      additionalFeesTotal;

    console.log("Pre-update calculations:", {
      waterAmount: update.waterAmount,
      electricityAmount: update.electricityAmount,
      totalAmount: update.totalAmount,
    });
  }
  next();
});

// Instance method for calculations
billSchema.methods.calculateAmounts = function () {
  const waterUsage = Number(this.waterUsage) || 0;
  const waterRate = Number(this.waterRate) || 0;
  const electricityUsage = Number(this.electricityUsage) || 0;
  const electricityRate = Number(this.electricityRate) || 0;
  const rentAmount = Number(this.rentAmount) || 0;

  this.waterAmount = waterUsage * waterRate;
  this.electricityAmount = electricityUsage * electricityRate;

  const additionalFeesTotal = Array.isArray(this.additionalFees)
    ? this.additionalFees.reduce(
        (sum, fee) => sum + (Number(fee.price) || 0),
        0
      )
    : 0;

  this.totalAmount =
    rentAmount +
    this.waterAmount +
    this.electricityAmount +
    additionalFeesTotal;

  return this;
};

const Bill = mongoose.models.Bill || mongoose.model("Bill", billSchema);

export default Bill;
