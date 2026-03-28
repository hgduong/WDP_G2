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
router.get("/movies/all", getAllMovies);
router.get("/movies/now-showing", getNowShowingMovies);
router.get("/movies/coming-soon", getComingSoonMovies);
router.get("/movies/special", getSpecialMovies);
router.get("/movies/:id", getMoviesById);  
router.post("/movies", addMovie);
router.put("/movies/:id", updateMovie);
router.delete("/movies/:id", deleteMovie);

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
