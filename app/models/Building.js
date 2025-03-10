import mongoose from "mongoose";

const BuildingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    floors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Floor",
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    waterRate: {
      type: Number,
      required: true,
      default: 0,
    },
    electricityRate: {
      type: Number,
      required: true,
      default: 0,
    },
    billingConfig: {
      dueDate: {
        type: Date,
        required: true,
      },
      dueDateDay: {
        type: Number,
        required: true,
        min: 1,
        max: 15,
        default: 5,
      },
      latePaymentCharge: {
        type: Number,
        required: true,
        default: 0,
      },
    },
    housekeepers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    }],
  },
  { timestamps: true }
);

// Add compound index for faster lookups
BuildingSchema.index({ createdBy: 1, name: 1 });

// Helper function to calculate due date
BuildingSchema.methods.calculateDueDate = function(billDate) {
  const date = new Date(billDate);
  const dueDay = this.billingConfig.dueDateDay;
  
  // Set to the due day in the next month
  date.setDate(dueDay);
  if (date.getDate() < dueDay) { // If we've rolled back (e.g. trying to set 31 in a 30-day month)
    date.setDate(dueDay); // Try again
  }
  
  // If the bill date is after the due day, move to next month
  const billDay = new Date(billDate).getDate();
  if (billDay >= dueDay) {
    date.setMonth(date.getMonth() + 1);
  }
  
  return date;
};

// Add a pre-save middleware to ensure housekeepers are also updated
BuildingSchema.pre('save', async function(next) {
  if (this.isModified('housekeepers')) {
    const Staff = mongoose.model('Staff');
    
    // Get the previous version of housekeepers if this is an update
    const oldHousekeepers = this._original ? this._original.housekeepers : [];
    const newHousekeepers = this.housekeepers;
    
    // Remove building from old housekeepers that are no longer assigned
    const removedHousekeepers = oldHousekeepers.filter(h => !newHousekeepers.includes(h));
    if (removedHousekeepers.length > 0) {
      await Staff.updateMany(
        { _id: { $in: removedHousekeepers } },
        { $pull: { assignedBuildings: this._id } }
      );
    }
    
    // Add building to new housekeepers
    const addedHousekeepers = newHousekeepers.filter(h => !oldHousekeepers.includes(h));
    if (addedHousekeepers.length > 0) {
      await Staff.updateMany(
        { _id: { $in: addedHousekeepers } },
        { $addToSet: { assignedBuildings: this._id } }
      );
    }
  }
  next();
});

const Building = mongoose.models.Building || mongoose.model("Building", BuildingSchema);

export default Building;
