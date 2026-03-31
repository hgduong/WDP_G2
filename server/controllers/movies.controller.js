// controllers/movies.controller.js
const mongoose = require("mongoose");
const Movie = require("../models/movie");
const Showtime = require("../models/showtime");
const Cinema = require("../models/cinema");
const Actor = require("../models/actor");
const Director = require("../models/director");

const normalizeName = (value) => value.trim().replace(/\s+/g, " ");

const extractCastInputs = (castInput) => {
  if (castInput === undefined) return { ids: undefined, names: undefined };
  if (castInput === null) return { ids: [], names: [] };
  if (typeof castInput === "string" && castInput.trim() === "") {
    return { ids: [], names: [] };
  }

  const ids = [];
  const names = [];

  const pushName = (name) => {
    const normalized = normalizeName(name || "");
    if (!normalized) return;
    names.push(normalized);
  };

  const pushId = (value) => {
    if (mongoose.isValidObjectId(value)) {
      ids.push(String(value));
    }
  };

  const handleItem = (item) => {
    if (!item) return;
    if (typeof item === "string") {
      if (item.includes(",")) {
        item.split(",").forEach((name) => pushName(name));
        return;
      }
      if (mongoose.isValidObjectId(item)) {
        pushId(item);
        return;
      }
      pushName(item);
      return;
    }
    if (typeof item === "object") {
      if (item._id && mongoose.isValidObjectId(item._id)) {
        pushId(item._id);
        return;
      }
      if (item.name) {
        pushName(item.name);
      }
    }
  };

  if (Array.isArray(castInput)) {
    castInput.forEach(handleItem);
  } else {
    handleItem(castInput);
  }

  const seen = new Set();
  const uniqueNames = names.filter((name) => {
    const key = name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    ids: [...new Set(ids)],
    names: uniqueNames
  };
};

const extractDirectorInputs = (directorInput) => {
  if (directorInput === undefined) return { ids: undefined, names: undefined };
  if (directorInput === null) return { ids: [], names: [] };
  if (typeof directorInput === "string" && directorInput.trim() === "") {
    return { ids: [], names: [] };
  }

  const ids = [];
  const names = [];

  const pushName = (name) => {
    const normalized = normalizeName(name || "");
    if (!normalized) return;
    names.push(normalized);
  };

  const pushId = (value) => {
    if (mongoose.isValidObjectId(value)) {
      ids.push(String(value));
    }
  };

  const handleItem = (item) => {
    if (!item) return;
    if (typeof item === "string") {
      if (item.includes(",")) {
        item.split(",").forEach((name) => pushName(name));
        return;
      }
      if (mongoose.isValidObjectId(item)) {
        pushId(item);
        return;
      }
      pushName(item);
      return;
    }
    if (typeof item === "object") {
      if (item._id && mongoose.isValidObjectId(item._id)) {
        pushId(item._id);
        return;
      }
      if (item.name) {
        pushName(item.name);
      }
    }
  };

  if (Array.isArray(directorInput)) {
    directorInput.forEach(handleItem);
  } else {
    handleItem(directorInput);
  }

  const seen = new Set();
  const uniqueNames = names.filter((name) => {
    const key = name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    ids: [...new Set(ids)],
    names: uniqueNames
  };
};

const resolveDirectorIds = async (directorInput) => {
  const extracted = extractDirectorInputs(directorInput);
  if (extracted.ids === undefined) return undefined;

  const directorIds = [...extracted.ids];
  for (const name of extracted.names) {
    const nameLower = name.toLowerCase();
    let director = await Director.findOne({ nameLower });
    if (!director) {
      director = await Director.create({ name, nameLower });
    }
    directorIds.push(director._id);
  }

  return directorIds;
};

const resolveActorIds = async (castInput) => {
  const extracted = extractCastInputs(castInput);
  if (extracted.ids === undefined) return undefined;

  const actorIds = [...extracted.ids];
  for (const name of extracted.names) {
    const nameLower = name.toLowerCase();
    let actor = await Actor.findOne({ nameLower });
    if (!actor) {
      actor = await Actor.create({ name, nameLower });
    }
    actorIds.push(actor._id);
  }

  return actorIds;
};

const populateMovie = (query) =>
  query.populate("directors", "name").populate("cast", "name");

const normalizeIdArray = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((item) => (typeof item === "string" ? item : item?._id))
    .filter(Boolean)
    .map(String);
};

// Đồng bộ quan hệ ngược:
// - Movie.cast <-> Actor.movies
// - Movie.directors <-> Director.movies
// Mục tiêu: đảm bảo 3 màn admin không bị lệch dữ liệu.
const syncMovieActorsAndDirectors = async (movieDoc) => {
  const movieId = String(movieDoc?._id);
  const castIds = normalizeIdArray(movieDoc?.cast);
  const directorIds = normalizeIdArray(movieDoc?.directors);

  if (movieId) {
    // Actor side
    if (castIds.length > 0) {
      await Actor.updateMany(
        { _id: { $in: castIds } },
        { $addToSet: { movies: movieId } }
      );
      await Actor.updateMany(
        { _id: { $nin: castIds }, movies: movieId },
        { $pull: { movies: movieId } }
      );
    } else {
      await Actor.updateMany(
        { movies: movieId },
        { $pull: { movies: movieId } }
      );
    }

    // Director side
    if (directorIds.length > 0) {
      await Director.updateMany(
        { _id: { $in: directorIds } },
        { $addToSet: { movies: movieId } }
      );
      await Director.updateMany(
        { _id: { $nin: directorIds }, movies: movieId },
        { $pull: { movies: movieId } }
      );
    } else {
      await Director.updateMany(
        { movies: movieId },
        { $pull: { movies: movieId } }
      );
    }
  }
};

// Hàm tự động cập nhật status phim dựa trên ngày
const updateMovieStatuses = async () => {
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Cập nhật các phim hết hạn -> Ended (trừ phim Special)
    await Movie.updateMany(
      { endDate: { $lt: now }, status: { $nin: ["Ended", "Special"] } },
      { $set: { status: "Ended" } }
    );

    // Cập nhật các phim đang chiếu -> NowShowing
    await Movie.updateMany(
      {
        releaseDate: { $lte: now },
        endDate: { $gte: now },
        status: { $nin: ["NowShowing", "Ended"] }
      },
      { $set: { status: "NowShowing" } }
    );

    // Cập nhật các phim sắp chiếu (trong vòng 7 ngày tới) -> ComingSoon (trừ Special)
    await Movie.updateMany(
      {
        releaseDate: { $gt: now, $lte: sevenDaysFromNow },
        status: { $nin: ["ComingSoon", "NowShowing", "Ended", "Special"] }
      },
      { $set: { status: "ComingSoon" } }
    );

    console.log("Movie statuses updated successfully");
  } catch (error) {
    console.error("Error updating movie statuses:", error);
  }
};

// Lấy danh sách tất cả phim
exports.getAllMovies = async (req, res) => {
  try {
    // Tự động cập nhật status trước khi trả về
    await updateMovieStatuses();
    const movies = await populateMovie(Movie.find().sort({ createdAt: -1 }));
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy phim theo id
exports.getMoviesById = async (req, res) => {
  try {
    const movie = await populateMovie(Movie.findById(req.params.id));
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
      return res
        .status(400)
        .json({ message: "Tên phim đã tồn tại trong hệ thống" });
    }

    const payload = { ...req.body };
    const directorIds = await resolveDirectorIds(
      req.body.directors !== undefined ? req.body.directors : req.body.director
    );
    const actorIds = await resolveActorIds(req.body.cast);

    if (directorIds !== undefined) payload.directors = directorIds;
    if (actorIds !== undefined) payload.cast = actorIds;

    const movie = new Movie(payload);
    await movie.save();
    await movie.populate([
      { path: "directors", select: "name" },
      { path: "cast", select: "name" }
    ]);
    await syncMovieActorsAndDirectors(movie);
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
      return res
        .status(400)
        .json({ message: "Tên phim đã tồn tại trong hệ thống" });
    }

    const payload = { ...req.body };
    const directorIds = await resolveDirectorIds(
      req.body.directors !== undefined ? req.body.directors : req.body.director
    );
    const actorIds = await resolveActorIds(req.body.cast);

    if (directorIds !== undefined) payload.directors = directorIds;
    if (actorIds !== undefined) payload.cast = actorIds;

    const movie = await Movie.findByIdAndUpdate(req.params.id, payload, {
      new: true
    });
    if (!movie) {
      return res.status(404).json({ message: "Phim không tồn tại" });
    }
    await movie.populate([
      { path: "directors", select: "name" },
      { path: "cast", select: "name" }
    ]);
    await syncMovieActorsAndDirectors(movie);
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

    // Đồng bộ lại Actor/Director (tránh trường hợp bị lệch danh sách movies)
    await syncMovieActorsAndDirectors(movie);

    res.json({ message: "Phim đã được xóa" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy phim đang chiếu
exports.getNowShowingMovies = async (req, res) => {
  try {
    await updateMovieStatuses();
    const movies = await populateMovie(
      Movie.find({ status: "NowShowing" }).sort({ releaseDate: -1 })
    );
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy phim sắp chiếu
exports.getComingSoonMovies = async (req, res) => {
  try {
    await updateMovieStatuses();
    const movies = await populateMovie(
      Movie.find({ status: "ComingSoon" }).sort({ releaseDate: 1 })
    );
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy phim đặc biệt
exports.getSpecialMovies = async (req, res) => {
  try {
    const movies = await populateMovie(
      Movie.find({ status: "Special" }).sort({ releaseDate: -1 })
    );
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


