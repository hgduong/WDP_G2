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
router.get("/", getAllCinemas);
router.get("/:id", getCinemaById);
router.post("/", addCinema);
router.put("/:id", updateCinema);
router.delete("/:id", deleteCinema);

// Room routes
router.get("/:cinemaId/rooms", getRoomsByCinema);
router.get("/rooms/:id", getRoomById);
router.post("/rooms", addRoom);
router.put("/rooms/:id", updateRoom);
router.delete("/rooms/:id", deleteRoom);

module.exports = router;
