import mongoose from "mongoose";

const StaffSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    building: { type: String, required: true },
    position: { type: String, required: true },
    salary: { type: Number, required: true },
    gender: { type: String },
    age: { type: Number },
    dateOfBirth: { type: String },
    firstDayOfWork: { type: String },
    lineId: { type: String },
    phone: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Staff || mongoose.model("Staff", StaffSchema);
