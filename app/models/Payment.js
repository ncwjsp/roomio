import mongoose from "mongoose";
const Schema = mongoose.Schema;

const paymentSchema = new Schema(
  {
    tenant: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    room: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    paidDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["Pending", "Paid", "Overdue"],
      default: "Pending",
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Bank Transfer", "Credit Card", "Other"],
    },
    description: {
      type: String,
    },
    receiptNumber: {
      type: String,
    },
    paymentType: {
      type: String,
      enum: ["Rent", "Deposit", "Utility", "Maintenance", "Other"],
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure the model is only compiled once
export default mongoose.models.Payment ||
  mongoose.model("Payment", paymentSchema);
