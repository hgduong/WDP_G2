// routes/cinema.routes.js
const express = require("express");
const router = express.Router();
const {
  getAllCinemas,
  getCinemaById,
  addCinema,
  updateCinema,
  deleteCinema,
  getRoomsByCinema,
  getRoomById,
  addRoom,
  updateRoom,
  deleteRoom
} = require("../controllers/cinema.controller");

// Cinema routes
router.get("/cinemas", getAllCinemas);
router.get("/cinemas/:id", getCinemaById);
router.post("/cinemas", addCinema);
router.put("/cinemas/:id", updateCinema);
router.delete("/cinemas/:id", deleteCinema);

// Room routes
router.get("/cinemas/:cinemaId/rooms", getRoomsByCinema);
router.get("/rooms/:id", getRoomById);
router.post("/rooms", addRoom);
router.put("/rooms/:id", updateRoom);
router.delete("/rooms/:id", deleteRoom);

module.exports = router;
