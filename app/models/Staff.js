import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    lineId: {
      type: String,
      required: true,
    },
    lineUserId: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      required: true,
      enum: ["Housekeeper", "Technician", "Manager"],
    },
    specialization: {
      type: String,
      default: "",
    },
    salary: {
      type: Number,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    landlordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedBuildings: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
    }],
  },
  {
    timestamps: true,
  }
);

// Add an index for faster lookups by lineUserId
staffSchema.index({ lineUserId: 1 });

const Staff = mongoose.models.Staff || mongoose.model("Staff", staffSchema);

export default Staff;
