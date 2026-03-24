// controllers/movies.controller.js
const Movie = require("../models/movie");
const Showtime = require("../models/showtime");
const Cinema = require("../models/cinema");

// Hàm tự động cập nhật status phim dựa trên ngày
const updateMovieStatuses = async () => {
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Cập nhật các phim hết hạn -> Ended (trừ phim Special)
    await Movie.updateMany(
      { endDate: { $lt: now }, status: { $nin: ['Ended', 'Special'] } },
      { $set: { status: 'Ended' } }
    );
    
    // Cập nhật các phim đang chiếu -> NowShowing
    await Movie.updateMany(
      { 
        releaseDate: { $lte: now },
        endDate: { $gte: now },
        status: { $nin: ['NowShowing', 'Ended'] }
      },
      { $set: { status: 'NowShowing' } }
    );
    
    // Cập nhật các phim sắp chiếu (trong vòng 7 ngày tới) -> ComingSoon (trừ Special)
    await Movie.updateMany(
      { 
        releaseDate: { $gt: now, $lte: sevenDaysFromNow },
        status: { $nin: ['ComingSoon', 'NowShowing', 'Ended', 'Special'] }
      },
      { $set: { status: 'ComingSoon' } }
    );
    
    console.log('Movie statuses updated successfully');
  } catch (error) {
    console.error('Error updating movie statuses:', error);
  }
};

// Lấy danh sách tất cả phim
exports.getAllMovies = async (req, res) => {
  try {
    // Tự động cập nhật status trước khi trả về
    await updateMovieStatuses();
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
    // Kiểm tra trùng tên phim
    const existingMovie = await Movie.findOne({ title: req.body.title });
    if (existingMovie) {
      return res.status(400).json({ message: "Tên phim đã tồn tại trong hệ thống" });
    }
    
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
    // Kiểm tra trùng tên phim (trừ phim hiện tại đang sửa)
    const existingMovie = await Movie.findOne({ 
      title: req.body.title, 
      _id: { $ne: req.params.id } 
    });
    if (existingMovie) {
      return res.status(400).json({ message: "Tên phim đã tồn tại trong hệ thống" });
    }
    
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
    await updateMovieStatuses();
    const movies = await Movie.find({ status: 'NowShowing' }).sort({ releaseDate: -1 });
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy phim sắp chiếu
exports.getComingSoonMovies = async (req, res) => {
  try {
    await updateMovieStatuses();
    const movies = await Movie.find({ status: 'ComingSoon' }).sort({ releaseDate: 1 });
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy phim đặc biệt
exports.getSpecialMovies = async (req, res) => {
  try {
    const movies = await Movie.find({ status: 'Special' }).sort({ releaseDate: -1 });
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
