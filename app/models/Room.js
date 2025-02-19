import mongoose from "mongoose";
import Floor from "./Floor"; // Import related models
import Tenant from "./Tenant";

const RoomSchema = new mongoose.Schema(
  {
    building: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
      required: true,
    },
    roomNumber: {
      type: String,
      required: true,
    },
    floor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Floor",
      required: true,
    },
    status: {
      type: String,
      enum: ["Available", "Occupied", "Unavailable"],
      default: "Available",
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
    },
    price: {
      type: Number,
      required: true,
    },
    currentMeterReadings: {
      water: {
        type: Number,
        default: 0,
      },
      electricity: {
        type: Number,
        default: 0,
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Create compound index for unique room numbers per building and user
RoomSchema.index(
  { roomNumber: 1, building: 1, createdBy: 1 },
  { unique: true }
);

// Force model recreation
mongoose.models = {};

const Room = mongoose.model("Room", RoomSchema);
export default Room;
