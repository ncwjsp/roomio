import mongoose from "mongoose";
const Schema = mongoose.Schema;

const statusHistorySchema = new Schema({
  status: {
    type: String,
    required: true,
    enum: ["Pending", "In Progress", "Completed", "Cancelled"],
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: "statusHistory.updatedByModel",
  },
  updatedByModel: {
    type: String,
    required: true,
    enum: ["Tenant", "User", "Staff"],
  },
  updatedAt: {
    type: Date,
    required: true,
  },
  comment: String,
});

const maintenanceSchema = new Schema(
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
    staff: {
      type: Schema.Types.ObjectId,
      ref: "Staff",
      default: null,
    },
    problem: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    images: [
      {
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    currentStatus: {
      type: String,
      enum: ["Pending", "In Progress", "Completed", "Cancelled"],
      default: "Pending",
    },
    statusHistory: [statusHistorySchema],
    estimatedCompletionDate: Date,
    actualCompletionDate: Date,
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

// Method to update status and record in history
maintenanceSchema.methods.updateStatus = async function (
  status,
  updatedBy,
  updatedByModel,
  note = ""
) {
  this.currentStatus = status;
  this.statusHistory.push({
    status,
    updatedBy,
    updatedByModel,
    note,
    timestamp: new Date(),
  });

  if (status === "Completed") {
    this.actualCompletionDate = new Date();
  }

  return this.save();
};

// Ensure the model is only compiled once
export default mongoose.models.Maintenance ||
  mongoose.model("Maintenance", maintenanceSchema);
