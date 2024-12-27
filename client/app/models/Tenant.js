import { Schema, models, model } from "mongoose";

const TenantSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    lineId: { type: String, required: true },
    pfp: { type: String },
    room: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    leaseStartDate: { type: Date, required: true },
    leaseEndDate: { type: Date, required: true },
    depositAmount: { type: Number, required: true },
  },
  { timestamps: true }
);

const Tenant = models.Tenant || model("Tenant", TenantSchema);

export default Tenant;
