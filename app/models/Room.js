import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: true,
      unique: true,
    },
    floor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Floor",
      required: true,
    },
    status: {
      type: String,
      enum: ["Available", "Unavailable", "Occupied"],
      default: "Available",
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      default: null,
    },
    price: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const Room = mongoose.models.Room || mongoose.model("Room", RoomSchema);
export default Room;
