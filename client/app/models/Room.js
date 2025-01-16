import { Schema, models, model } from "mongoose";

const RoomSchema = new Schema(
  {
    roomNumber: {
      type: String,
      required: true,
      unique: true,
    },
    floor: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["Available", "Occupied"],
      default: "Available",
    },
    building: {
      type: Schema.Types.ObjectId,
      ref: "Building",
      required: true,
    },
    tenant: {
      type: Schema.Types.ObjectId,
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

const Room = models.Room || model("Room", RoomSchema);

export default Room;
