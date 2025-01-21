import mongoose from "mongoose";

const billingSchema = new mongoose.Schema(
  {
    utilityUsage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UtilityUsage",
      required: true,
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    billingPeriod: {
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
    },
    charges: {
      electricity: {
        amount: {
          type: Number,
          required: true,
        },
        units: {
          type: Number,
          required: true,
        },
      },
      water: {
        amount: {
          type: Number,
          required: true,
        },
        units: {
          type: Number,
          required: true,
        },
      },
      additionalCharges: [
        {
          description: {
            type: String,
            required: true,
          },
          amount: {
            type: Number,
            required: true,
          },
        },
      ],
      totalAmount: {
        type: Number,
        required: true,
      },
    },
    payment: {
      status: {
        type: String,
        enum: ["pending", "partial", "paid", "overdue"],
        default: "pending",
      },
      dueDate: {
        type: Date,
        required: true,
      },
      transactions: [
        {
          amount: {
            type: Number,
            required: true,
          },
          paymentDate: {
            type: Date,
            required: true,
          },
          paymentMethod: {
            type: String,
            enum: ["cash", "bank_transfer", "credit_card", "other"],
            required: true,
          },
          reference: String,
          notes: String,
        },
      ],
      amountPaid: {
        type: Number,
        default: 0,
      },
      remainingBalance: {
        type: Number,
        default: function () {
          return this.charges.totalAmount - this.payment.amountPaid;
        },
      },
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
billingSchema.index({ tenant: 1, "billingPeriod.startDate": -1 });
billingSchema.index({ room: 1, "billingPeriod.startDate": -1 });
billingSchema.index({ invoiceNumber: 1 }, { unique: true });
billingSchema.index({ "payment.status": 1, "payment.dueDate": 1 });

// Method to add a payment transaction
billingSchema.methods.addPayment = function (paymentDetails) {
  this.payment.transactions.push(paymentDetails);
  this.payment.amountPaid += paymentDetails.amount;
  this.payment.remainingBalance =
    this.charges.totalAmount - this.payment.amountPaid;

  // Update payment status
  if (this.payment.remainingBalance <= 0) {
    this.payment.status = "paid";
  } else if (this.payment.amountPaid > 0) {
    this.payment.status = "partial";
  }

  return this.save();
};

// Method to check if payment is overdue
billingSchema.methods.checkOverdue = function () {
  if (
    this.payment.status !== "paid" &&
    this.payment.dueDate < new Date() &&
    this.payment.remainingBalance > 0
  ) {
    this.payment.status = "overdue";
    return this.save();
  }
  return this;
};

const Billing =
  mongoose.models.Billing || mongoose.model("Billing", billingSchema);

export default Billing;
