import { Schema, models, model } from "mongoose";

const FriendSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    pfp: { type: String, required: true },
    isTenant: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Friend = models.Friend || model("Friend", FriendSchema);

export default Friend;
