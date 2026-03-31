const express = require("express");
const {
  getAllDirectors,
  getDirectorById,
  createDirector,
  updateDirector,
  deleteDirector
} = require("../controllers/directors.controller");

const router = express.Router();

router.get("/", getAllDirectors);
router.get("/:id", getDirectorById);
router.post("/", createDirector);
router.put("/:id", updateDirector);
router.delete("/:id", deleteDirector);

module.exports = router;
