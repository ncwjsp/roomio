import { Schema, models, model } from "mongoose";

const TenantSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    lineId: {
      type: String,
      required: true,
      trim: true,
    },
    lineUserId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    pfp: {
      type: String,
      trim: true,
    },
    room: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    depositAmount: {
      type: Number,
      required: true,
    },
    leaseStartDate: {
      type: Date,
      required: true,
    },
    leaseEndDate: {
      type: Date,
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Tenant = models.Tenant || model("Tenant", TenantSchema);

export default Tenant;
