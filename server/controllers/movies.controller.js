// controllers/movies.controller.js
const Movie = require("../models/movie");
const Showtime = require("../models/showtime");
const Cinema = require("../models/cinema");
    
// Lấy danh sách tất cả phim
exports.getAllMovies = async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 });
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy phim theo id
exports.getMoviesById = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);  
    if (!movie) {
      return res.status(404).json({ message: "Phim không tồn tại" });
    }
    res.json(movie);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Thêm phim mới
exports.addMovie = async (req, res) => {
  try {
    const movie = new Movie(req.body); 
    await movie.save(); 
    res.status(201).json(movie); 
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Cập nhật phim
exports.updateMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!movie) {
      return res.status(404).json({ message: "Phim không tồn tại" });
    } 
    res.json(movie);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Xóa phim theo id
exports.deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: "Phim không tồn tại" });
    } 
    
    // Xóa các lịch chiếu liên quan
    await Showtime.deleteMany({ movieId: req.params.id });
    
    // Xóa phim khỏi mảng movies trong các Cinema
    await Cinema.updateMany(
      { movies: req.params.id },
      { $pull: { movies: req.params.id } }
    );
    
    res.json({ message: "Phim đã được xóa" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy phim đang chiếu
exports.getNowShowingMovies = async (req, res) => {
  try {
    const movies = await Movie.find({ status: 'NowShowing' }).sort({ releaseDate: -1 });
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy phim sắp chiếu
exports.getComingSoonMovies = async (req, res) => {
  try {
    const movies = await Movie.find({ status: 'ComingSoon' }).sort({ releaseDate: 1 });
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
