// routes/seats.route.js
const express = require("express");
const router = express.Router();
const seatmapController = require("../controllers/seatmap.controller");

// Generate seat layout for a room based on capacity
router.post("/seatmap/generate", seatmapController.generateSeatLayout);

// Get seatmap by showtime
router.get("/seatmap/:showtimeId", seatmapController.getSeatmapByShowtime);

// Get held seats for a showtime (for real-time sync)
router.get("/seats/held/:showtimeId", seatmapController.getHeldSeats);

// Hold seats (when user selects them)
router.post("/seats/hold", seatmapController.holdSeats);

// Release held seats
router.post("/seats/release", seatmapController.releaseSeats);

// Book seats
router.post("/seats/book", seatmapController.bookSeats);

module.exports = router;
