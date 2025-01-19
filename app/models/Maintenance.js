import mongoose from "mongoose";

const MaintenanceSchema = new mongoose.Schema(
  {
    roomNo: { type: String, required: true },
    building: { type: String, required: true },
    name: { type: String, required: true },
    date: { type: String, required: true },
    workType: { type: String, required: true, enum: ["Plumber", "Electrician"] },
    status: { type: String, required: true, enum: ["successful", "in process", "waiting"] },
    assignedTo: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Maintenance || mongoose.model("Maintenance", MaintenanceSchema);
