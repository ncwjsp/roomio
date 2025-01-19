import mongoose from "mongoose";

const StaffSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    building: { type: String, required: true },
    position: { type: String, required: true },
    salary: { type: Number, required: true },
    role: { type: String, required: true, enum: ["Housekeeper", "Electrician", "Plumber", "Manager", "Technician"] },
  },
  { timestamps: true }
);

export default mongoose.models.Staff || mongoose.model("Staff", StaffSchema);
