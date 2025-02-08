import { Schema, models, model } from "mongoose";
import crypto from "crypto";

const UserSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    lineConfig: {
      channelAccessToken: String,
      channelSecret: String,
      tenantRichMenuId: String,
      staffRichMenuId: String,
      liffIds: {
        parcels: String,
        reports: String,
        billing: String,
        cleaning: String,
        maintenance: String,
        announcement: String,
        schedule: String,
        tasks: String,
      },
    },
    bankCode: {
      type: String,
      default: "",
    },
    accountNumber: {
      type: String,
      default: "",
    },
    accountName: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const User = models.User || model("User", UserSchema);

export default User;
