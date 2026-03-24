// routes/seats.route.js
const express = require("express");
const router = express.Router();
const seatmapController = require("../controllers/seatmap.controller");

// Get held seats for a showtime (for real-time sync)
router.get("/seats/held/:showtimeId", seatmapController.getHeldSeats);

// Hold seats (when user selects them)
router.post("/seats/hold", seatmapController.holdSeats);

// Release held seats
router.post("/seats/release", seatmapController.releaseSeats);

// Book seats
router.post("/seats/book", seatmapController.bookSeats);

module.exports = router;
