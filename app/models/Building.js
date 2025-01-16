import { Schema, models, model } from "mongoose";

const BuildingSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    rooms: [
      {
        type: Schema.Types.ObjectId,
        ref: "Room",
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Building = models.Building || model("Building", BuildingSchema);

export default Building;
