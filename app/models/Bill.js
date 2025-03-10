import mongoose from "mongoose";

const billSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    buildingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
      required: true,
    },
    month: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          // Validate YYYY-MM format
          return /^\d{4}-\d{2}$/.test(v);
        },
        message: props => `${props.value} is not a valid month format. Use YYYY-MM format.`
      }
    },
    billingDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
      validate: {
        validator: function(v) {
          return v instanceof Date && !isNaN(v);
        },
        message: props => 'Invalid due date'
      }
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
    waterUsage: {
      type: Number,
      default: 0,
    },
    electricityUsage: {
      type: Number,
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
    totalAmount: {
      type: Number,
      default: 0,
    },
    additionalFees: [
      {
        name: String,
        price: Number,
      },
    ],
    notes: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["null", "pending", "paid"],
      default: "null",
    },
    paymentDate: {
      type: Date,
      default: null,
    },
    slipData: {
      type: String,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    initialMeterReadings: {
      water: {
        type: Number,
        default: 0,
      },
      electricity: {
        type: Number,
        default: 0,
      },
      lastUpdated: {
        type: Date,
      }
    },
    currentMeterReadings: {
      water: {
        type: Number,
        default: 0,
      },
      electricity: {
        type: Number,
        default: 0,
      },
      lastUpdated: {
        type: Date,
      }
    },
    isSent: {
      type: Boolean,
      default: false
    },
  },
  {
    timestamps: true,
  }
);

// Pre-update middleware
billSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update.$set) {
    // Check if we're using $set operator
    const waterUsage = Number(update.$set.waterUsage) || 0;
    const waterRate = Number(update.$set.waterRate) || 0;
    const electricityUsage = Number(update.$set.electricityUsage) || 0;
    const electricityRate = Number(update.$set.electricityRate) || 0;
    const rentAmount = Number(update.$set.rentAmount) || 0;

    // Only calculate if we don't already have the values in the update
    if (!update.$set.waterAmount) {
      update.$set.waterAmount = waterUsage * waterRate;
    }
    if (!update.$set.electricityAmount) {
      update.$set.electricityAmount = electricityUsage * electricityRate;
    }
    if (!update.$set.totalAmount) {
      // Calculate additional fees total
      const additionalFeesTotal = Array.isArray(update.$set.additionalFees)
        ? update.$set.additionalFees.reduce(
            (sum, fee) => sum + (Number(fee.price) || 0),
            0
          )
        : 0;

      console.log("Pre-update calculating total amount:", {
        rentAmount,
        waterAmount: update.$set.waterAmount,
        electricityAmount: update.$set.electricityAmount,
        additionalFeesTotal,
      });

      // Calculate total amount
      update.$set.totalAmount =
        rentAmount +
        update.$set.waterAmount +
        update.$set.electricityAmount +
        additionalFeesTotal;
    }

    console.log("Pre-update calculations:", {
      waterUsage,
      waterRate,
      electricityUsage,
      electricityRate,
      rentAmount,
      waterAmount: update.$set.waterAmount,
      electricityAmount: update.$set.electricityAmount,
      totalAmount: update.$set.totalAmount,
      additionalFees: update.$set.additionalFees || []
    });
  }
  next();
});

// Instance method for calculations
billSchema.methods.calculateAmounts = function () {
  // Calculate utility amounts
  this.waterAmount = Number(this.waterUsage || 0) * Number(this.waterRate || 0);
  this.electricityAmount = Number(this.electricityUsage || 0) * Number(this.electricityRate || 0);
  
  // Calculate additional fees total
  const additionalFeesTotal = Array.isArray(this.additionalFees)
    ? this.additionalFees.reduce(
        (sum, fee) => sum + (Number(fee.price) || 0),
        0
      )
    : 0;

  // Log calculations for debugging
  console.log("Calculating amounts:", {
    rentAmount: this.rentAmount,
    waterAmount: this.waterAmount,
    electricityAmount: this.electricityAmount,
    additionalFeesTotal,
    additionalFees: this.additionalFees
  });

  // Calculate total amount
  this.totalAmount =
    Number(this.rentAmount || 0) +
    Number(this.waterAmount || 0) +
    Number(this.electricityAmount || 0) +
    additionalFeesTotal;

  return this;
};

const Bill = mongoose.models.Bill || mongoose.model("Bill", billSchema);

export default Bill;
