import express from "express";
import Itinerary from "../models/Itinerary.js";
import { auth } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * Itinerary Routes
 * Manage user travel itineraries
 */

// ========================================
// CREATE - Save new itinerary
// ========================================
router.post("/", auth, async (req, res) => {
  try {
    const {
      destination,
      startPoint,
      startDate,
      endDate,
      tripDays,
      budget,
      expenses,
      dailyPlan,
      status,
      notes,
    } = req.body;

    // Validation
    if (!destination || !startDate || !endDate || !budget) {
      return res.status(400).json({
        error: "Missing required fields: destination, startDate, endDate, budget",
      });
    }

    const itinerary = new Itinerary({
      userId: req.userId,
      userEmail: req.user.email,
      destination,
      startPoint,
      startDate,
      endDate,
      tripDays,
      budget,
      expenses,
      dailyPlan,
      status: status || "planned",
      notes,
    });

    await itinerary.save();

    res.status(201).json({
      message: "Itinerary saved successfully",
      itinerary: itinerary.getSummary(),
    });
  } catch (error) {
    console.error("Error saving itinerary:", error);
    res.status(500).json({
      error: "Failed to save itinerary",
      details: error.message,
    });
  }
});

// ========================================
// READ - Get all user itineraries
// ========================================
router.get("/", auth, async (req, res) => {
  try {
    const { status, destination, limit = 20 } = req.query;

    const query = { userId: req.userId };
    if (status) query.status = status;
    if (destination) query.destination = new RegExp(destination, "i");

    const itineraries = await Itinerary.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      count: itineraries.length,
      itineraries: itineraries.map((i) => i.getSummary()),
    });
  } catch (error) {
    console.error("Error fetching itineraries:", error);
    res.status(500).json({ error: "Failed to fetch itineraries" });
  }
});

// ========================================
// READ - Get single itinerary by ID
// ========================================
router.get("/:id", auth, async (req, res) => {
  try {
    const itinerary = await Itinerary.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!itinerary) {
      return res.status(404).json({ error: "Itinerary not found" });
    }

    res.json(itinerary);
  } catch (error) {
    console.error("Error fetching itinerary:", error);
    res.status(500).json({ error: "Failed to fetch itinerary" });
  }
});

// ========================================
// UPDATE - Update existing itinerary
// ========================================
router.put("/:id", auth, async (req, res) => {
  try {
    const itinerary = await Itinerary.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!itinerary) {
      return res.status(404).json({ error: "Itinerary not found" });
    }

    // Update fields
    const allowedUpdates = [
      "destination",
      "startPoint",
      "startDate",
      "endDate",
      "tripDays",
      "budget",
      "expenses",
      "dailyPlan",
      "status",
      "notes",
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        itinerary[field] = req.body[field];
      }
    });

    await itinerary.save();

    res.json({
      message: "Itinerary updated successfully",
      itinerary: itinerary.getSummary(),
    });
  } catch (error) {
    console.error("Error updating itinerary:", error);
    res.status(500).json({ error: "Failed to update itinerary" });
  }
});

// ========================================
// DELETE - Delete itinerary
// ========================================
router.delete("/:id", auth, async (req, res) => {
  try {
    const itinerary = await Itinerary.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!itinerary) {
      return res.status(404).json({ error: "Itinerary not found" });
    }

    res.json({
      message: "Itinerary deleted successfully",
      deletedId: req.params.id,
    });
  } catch (error) {
    console.error("Error deleting itinerary:", error);
    res.status(500).json({ error: "Failed to delete itinerary" });
  }
});

// ========================================
// ANALYTICS - Get user itinerary statistics
// ========================================
router.get("/analytics/stats", auth, async (req, res) => {
  try {
    const userId = req.userId;

    const itineraries = await Itinerary.find({ userId });

    // Calculate statistics
    const stats = {
      totalItineraries: itineraries.length,
      totalTripDays: itineraries.reduce((sum, i) => sum + i.tripDays, 0),
      totalBudget: itineraries.reduce((sum, i) => sum + i.budget, 0),
      avgBudgetPerTrip: 0,
      avgTripDuration: 0,
      destinationBreakdown: {},
      statusBreakdown: {},
      expenseBreakdown: {
        Accommodation: 0,
        Transport: 0,
        Food: 0,
        Activities: 0,
        Misc: 0,
      },
      monthlyDistribution: {},
      upcomingTrips: 0,
      completedTrips: 0,
    };

    if (itineraries.length > 0) {
      stats.avgBudgetPerTrip = Math.round(
        stats.totalBudget / itineraries.length
      );
      stats.avgTripDuration = Math.round(
        stats.totalTripDays / itineraries.length
      );

      itineraries.forEach((itinerary) => {
        // Destination breakdown
        stats.destinationBreakdown[itinerary.destination] =
          (stats.destinationBreakdown[itinerary.destination] || 0) + 1;

        // Status breakdown
        stats.statusBreakdown[itinerary.status] =
          (stats.statusBreakdown[itinerary.status] || 0) + 1;

        // Expense breakdown
        Object.keys(itinerary.expenses).forEach((key) => {
          stats.expenseBreakdown[key] += itinerary.expenses[key] || 0;
        });

        // Monthly distribution
        const month = new Date(itinerary.startDate).toLocaleString("default", {
          month: "short",
          year: "numeric",
        });
        stats.monthlyDistribution[month] =
          (stats.monthlyDistribution[month] || 0) + 1;

        // Count upcoming and completed
        const now = new Date();
        if (itinerary.startDate > now) stats.upcomingTrips++;
        if (itinerary.status === "completed") stats.completedTrips++;
      });
    }

    res.json(stats);
  } catch (error) {
    console.error("Error fetching itinerary stats:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

export default router;