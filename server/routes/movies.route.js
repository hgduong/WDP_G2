const {getAllMovies, getMoviesById} = require("../controllers/movies.controller");
const { getShowtimesByMovie } = require("../controllers/showtime.controller");
const express = require("express");
const router = express.Router();    

router.get("/movies/all", getAllMovies);
router.get("/movies/:id", getMoviesById);  
router.get("/showtimes/:movieId", getShowtimesByMovie);

module.exports = router;



