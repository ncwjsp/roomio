import { Schema, models, model } from "mongoose";

const LineContactSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    pfp: { type: String, required: true },
    isTenant: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const LineContact =
  models.LineContact || model("LineContact", LineContactSchema);

export default LineContact;
