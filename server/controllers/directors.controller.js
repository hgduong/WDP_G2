// controllers/directors.controller.js
const mongoose = require("mongoose");
const Director = require("../models/director");
const Movie = require("../models/movie");

const normalizeName = (value) => value.trim().replace(/\s+/g, " ");

const normalizeMovies = (movies) => {
  if (!Array.isArray(movies)) return [];
  return movies.filter((id) => mongoose.isValidObjectId(id));
};

const syncDirectorMovies = async (directorId, selectedMovieIds) => {
  const selectedIds = selectedMovieIds.map(String);

  await Movie.updateMany(
    { _id: { $in: selectedIds } },
    { $addToSet: { directors: directorId } }
  );

  await Movie.updateMany(
    { _id: { $nin: selectedIds }, directors: directorId },
    { $pull: { directors: directorId } }
  );
};

exports.getAllDirectors = async (req, res) => {
  try {
    const directors = await Director.find();

    if (!directors){
      return res.status(404).json({message: "Không có đạo diễn nào"})
    }
    res.json(directors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDirectorById = async (req, res) => {
  try {
    const director = await Director.findById(req.params.id);
    if (!director) {
      return res.status(404).json({ message: "Đạo diễn không tồn tại" });
    }
    res.json(director);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createDirector = async (req, res) => {
  try {
    const name = normalizeName(req.body.name || "");
    if (!name) {
      return res.status(400).json({ message: "Tên đạo diễn là bắt buộc" });
    }

    const nameLower = name.toLowerCase();
    const existing = await Director.findOne({ nameLower });
    if (existing) {
      return res.status(400).json({ message: "Đạo diễn đã tồn tại" });
    }

    const movies = normalizeMovies(req.body.movies);

    const director = await Director.create({
      name,
      nameLower,
      dateOfBirth: req.body.dateOfBirth || null,
      gender: req.body.gender || null,
      nationality: req.body.nationality || "",
      description: req.body.description || "",
      movies
    });

    await syncDirectorMovies(director._id, movies);

    res.status(201).json(director);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateDirector = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.name !== undefined) {
      const name = normalizeName(payload.name || "");
      if (!name) {
        return res.status(400).json({ message: "Tên đạo diễn là bắt buộc" });
      }
      payload.name = name;
      payload.nameLower = name.toLowerCase();
    }

    if (payload.movies !== undefined) {
      payload.movies = normalizeMovies(payload.movies);
    }

    if (payload.gender !== undefined) {
      payload.gender = payload.gender ? payload.gender : null;
    }

    const director = await Director.findByIdAndUpdate(req.params.id, payload, {
      new: true
    });

    if (!director) {
      return res.status(404).json({ message: "Đạo diễn không tồn tại" });
    }

    if (payload.movies) {
      await syncDirectorMovies(director._id, payload.movies);
    }

    res.json(director);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteDirector = async (req, res) => {
  try {
    const director = await Director.findByIdAndDelete(req.params.id);
    if (!director) {
      return res.status(404).json({ message: "Đạo diễn không tồn tại" });
    }

    await Movie.updateMany(
      { directors: director._id },
      { $pull: { directors: director._id } }
    );

    res.json({ message: "Đã xóa đạo diễn" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
