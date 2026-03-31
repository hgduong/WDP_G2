// routes/seats.route.js
const express = require("express");
const router = express.Router();
const seatmapController = require("../controllers/seatmap.controller");

// Generate seat layout for a room based on capacity
router.post("/generate", seatmapController.generateSeatLayout);

// Get seatmap by showtime
router.get("/:showtimeId", seatmapController.getSeatmapByShowtime);

// Get held seats for a showtime (for real-time sync)
router.get("/held/:showtimeId", seatmapController.getHeldSeats);

// Hold seats (when user selects them)
router.post("/hold", seatmapController.holdSeats);

// Release held seats
router.post("/release", seatmapController.releaseSeats);

// Book seats
router.post("/book", seatmapController.bookSeats);

// Get seats by room (from seatmap template)
router.get("/room/:roomId", seatmapController.getSeatsByRoom);

// Update seat (type, row, number)
router.put("/:seatId", seatmapController.updateSeat);

// Delete seat
router.delete("/:seatId", seatmapController.deleteSeat);

// Add new seat to room
router.post("/room/:roomId", seatmapController.addSeat);

module.exports = router;
