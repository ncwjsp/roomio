import mongoose from "mongoose";

const cleaningScheduleSchema = new mongoose.Schema(
  {
    month: {
      type: String,
      required: true,
    },
    selectedDays: {
      type: [String],
      required: true,
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: "At least one day must be selected",
      },
    },
    slotDuration: {
      type: Number,
      required: true,
    },
    timeRanges: [
      {
        start: {
          type: String,
          required: true,
        },
        end: {
          type: String,
          required: true,
        },
      },
    ],
    buildingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
      required: true,
    },
    landlordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    slots: [
      {
        date: String,
        fromTime: String,
        toTime: String,
        bookedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Tenant",
          default: null,
        },
        bookedAt: { 
          type: Date, 
          default: null 
        },
        status: {
          type: String,
          enum: ['available', 'pending', 'completed', 'cancelled'],
          default: 'available'
        },
        completedAt: {
          type: Date,
          default: null
        },
        completedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Staff",
          default: null
        }
      },
    ],
  },
  {
    timestamps: true,
  }
);

const CleaningSchedule =
  mongoose.models.CleaningSchedule ||
  mongoose.model("CleaningSchedule", cleaningScheduleSchema);

export default CleaningSchedule;
