import mongoose from "mongoose";

const FloorSchema = new mongoose.Schema(
  {
    floorNumber: {
      type: Number,
      required: true,
    },
    building: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
      required: true,
    },
    rooms: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
      },
    ],
  },
  { timestamps: true }
);

const Floor = mongoose.models.Floor || mongoose.model("Floor", FloorSchema);
export default Floor;
