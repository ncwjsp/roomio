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
    publicId: {
      type: String,
      unique: true,
      default: () => crypto.randomBytes(16).toString("hex"), // generates a 32-character random string
    },
    lineConfig: {
      channelAccessToken: {
        type: String,
        default: null,
      },
      channelSecret: {
        type: String,
        default: null,
      },
      liffIds: {
        parcels: {
          type: String,
          default: null,
        },
        reports: {
          type: String,
          default: null,
        },
        billing: {
          type: String,
          default: null,
        },
        cleaning: {
          type: String,
          default: null,
        },
        maintenance: {
          type: String,
          default: null,
        },
      },
    },
  },
  { timestamps: true }
);

const User = models.User || model("User", UserSchema);

export default User;
