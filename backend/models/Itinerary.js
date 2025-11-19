import mongoose from "mongoose";

/**
 * Itinerary Model
 * Stores user-generated travel itineraries with all trip details
 */

const itinerarySchema = new mongoose.Schema(
  {
    // User identification
    userId: {
      type: String,
      required: [true, "User ID is required"],
      index: true,
    },
    userEmail: {
      type: String,
      required: [true, "User email is required"],
      lowercase: true,
      trim: true,
      index: true,
    },

    // Trip basic info
    destination: {
      type: String,
      required: [true, "Destination is required"],
      trim: true,
    },
    startPoint: {
      type: String,
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    tripDays: {
      type: Number,
      required: true,
    },

    // Budget information
    budget: {
      type: Number,
      required: [true, "Budget is required"],
      min: 0,
    },
    expenses: {
      Accommodation: { type: Number, default: 0 },
      Transport: { type: Number, default: 0 },
      Food: { type: Number, default: 0 },
      Activities: { type: Number, default: 0 },
      Misc: { type: Number, default: 0 },
    },

    // Daily itinerary
    dailyPlan: [
      {
        dayNumber: Number,
        activities: [
          {
            name: String,
            city: String,
            hours: Number,
            cost: Number,
          },
        ],
      },
    ],

    // Metadata
    status: {
      type: String,
      enum: ["draft", "planned", "ongoing", "completed", "cancelled"],
      default: "planned",
    },
    notes: {
      type: String,
      maxlength: 2000,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// Indexes for efficient queries
itinerarySchema.index({ userId: 1, createdAt: -1 });
itinerarySchema.index({ userEmail: 1, startDate: -1 });
itinerarySchema.index({ destination: 1 });
itinerarySchema.index({ status: 1 });

// Virtual for total attractions count
itinerarySchema.virtual("totalAttractions").get(function () {
  return this.dailyPlan.reduce(
    (total, day) => total + day.activities.length,
    0
  );
});

// Virtual for total activities cost
itinerarySchema.virtual("totalActivitiesCost").get(function () {
  return this.dailyPlan.reduce(
    (total, day) =>
      total + day.activities.reduce((sum, act) => sum + (act.cost || 0), 0),
    0
  );
});

// Ensure virtuals are included in JSON
itinerarySchema.set("toJSON", { virtuals: true });
itinerarySchema.set("toObject", { virtuals: true });

/**
 * Get itinerary summary for analytics
 */
itinerarySchema.methods.getSummary = function () {
  return {
    id: this._id,
    destination: this.destination,
    startDate: this.startDate,
    endDate: this.endDate,
    tripDays: this.tripDays,
    budget: this.budget,
    status: this.status,
    totalAttractions: this.totalAttractions,
    totalActivitiesCost: this.totalActivitiesCost,
    createdAt: this.createdAt,
  };
};

const Itinerary = mongoose.model("Itinerary", itinerarySchema);

export default Itinerary;