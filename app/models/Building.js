import mongoose from "mongoose";

const BuildingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    floors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Floor",
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Building =
  mongoose.models.Building || mongoose.model("Building", BuildingSchema);
export default Building;
