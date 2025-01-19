import { Schema, models, model } from "mongoose";

const ParcelSchema = new Schema(
  {
    // Room reference
    room: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },

    // Tenant reference
    tenant: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },

    // Recipient name (might be different from tenant)
    recipient: {
      type: String,
      required: true,
      trim: true,
    },

    // Parcel details
    trackingNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // Status with enum validation
    status: {
      type: String,
      enum: ["uncollected", "collected"],
      default: "uncollected",
    },

    // Collection details
    collectedAt: {
      type: Date,
    },

    // Notification status
    notificationSent: {
      type: Boolean,
      default: false,
    },

    // Timestamps for tracking
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // This will automatically handle createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ParcelSchema.virtual("location").get(function () {
  return `Room ${this.room?.roomNumber}, ${this.room?.floor?.building?.name}`;
});

const Parcel = models.Parcel || model("Parcel", ParcelSchema);

export default Parcel;
