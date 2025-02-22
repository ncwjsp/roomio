import mongoose from "mongoose";

const CleaningSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true },
    building: { type: String, required: true },
    floor: { type: String, required: true },
    name: { type: String, required: true },
    date: { type: String, required: true },
    status: { type: String, required: true, enum: ["waiting", "successful", "in process"] },
    assignedTo: { type: String, required: true },
    timeSlot: { type: String, required: true }, 
  },
  { timestamps: true }
);

export default mongoose.models.Cleaning || mongoose.model("Cleaning", CleaningSchema);
