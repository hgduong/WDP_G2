const {
  getAllMovies, 
  getMoviesById, 
  addMovie, 
  updateMovie, 
  deleteMovie,
  getNowShowingMovies,
  getComingSoonMovies,
  getSpecialMovies
} = require("../controllers/movies.controller");
const { getShowtimesByMovie } = require("../controllers/showtime.controller");
const express = require("express");
const router = express.Router();    

// Movie routes
router.get("/all", getAllMovies);
router.get("/now-showing", getNowShowingMovies);
router.get("/coming-soon", getComingSoonMovies);
router.get("/special", getSpecialMovies);
router.get("/:id", getMoviesById);  
router.post("/", addMovie);
router.put("/:id", updateMovie);
router.delete("/:id", deleteMovie);

// Showtime routes
router.get("/showtimes", require("../controllers/showtime.controller").getAllShowtimes);
router.get("/showtimes/movie/:movieId", getShowtimesByMovie);
router.get("/showtimes/cinema/:cinemaId", require("../controllers/showtime.controller").getShowtimesByCinema);
router.get("/showtimes/:id", require("../controllers/showtime.controller").getShowtimeById);
router.post("/showtimes/ids", require("../controllers/showtime.controller").getShowtimesByIds);
router.post("/showtimes", require("../controllers/showtime.controller").addShowtime);
router.put("/showtimes/:id", require("../controllers/showtime.controller").updateShowtime);
router.delete("/showtimes/:id", require("../controllers/showtime.controller").deleteShowtime);

module.exports = router;
