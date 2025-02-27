import mongoose from "mongoose";
const Schema = mongoose.Schema;

const expenseSchema = new Schema(
  {
    category: {
      type: String,
      enum: ["Maintenance", "Utilities", "Staff", "Supplies", "Taxes", "Insurance", "Other"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Bank Transfer", "Credit Card", "Other"],
      required: true,
    },
    receiptNumber: {
      type: String,
    },
    building: {
      type: Schema.Types.ObjectId,
      ref: "Building",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    landlordId: {
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
export default mongoose.models.Expense ||
  mongoose.model("Expense", expenseSchema);
