// controllers/actors.controller.js
const mongoose = require("mongoose");
const Actor = require("../models/actor");
const Movie = require("../models/movie");

const normalizeName = (value) => value.trim().replace(/\s+/g, " ");

const normalizeMovies = (movies) => {
  if (!Array.isArray(movies)) return [];
  return movies.filter((id) => mongoose.isValidObjectId(id));
};

const syncActorMovies = async (actorId, selectedMovieIds) => {
  const selectedIds = selectedMovieIds.map(String);

  await Movie.updateMany(
    {
      _id: { $in: selectedIds },
      $or: [
        { cast: { $type: "string" } },
        { cast: { $exists: false } },
        { cast: null }
      ]
    },
    { $set: { cast: [] } }
  );

  await Movie.updateMany(
    { _id: { $in: selectedIds } },
    { $addToSet: { cast: actorId } }
  );

  await Movie.updateMany(
    { _id: { $nin: selectedIds }, cast: actorId },
    { $pull: { cast: actorId } }
  );
};

exports.getAllActors = async (req, res) => {
  try {
    const actors = await Actor.find().sort({ nameLower: 1 });
    res.json(actors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getActorById = async (req, res) => {
  try {
    const actor = await Actor.findById(req.params.id);
    if (!actor) {
      return res.status(404).json({ message: "Diễn viên không tồn tại" });
    }
    res.json(actor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createActor = async (req, res) => {
  try {
    const name = normalizeName(req.body.name || "");
    if (!name) {
      return res.status(400).json({ message: "Tên diễn viên là bắt buộc" });
    }

    const nameLower = name.toLowerCase();
    const existing = await Actor.findOne({ nameLower });
    if (existing) {
      return res.status(400).json({ message: "Diễn viên đã tồn tại" });
    }

    const movies = normalizeMovies(req.body.movies);

    const actor = await Actor.create({
      name,
      nameLower,
      dateOfBirth: req.body.dateOfBirth || null,
      gender: req.body.gender || null,
      nationality: req.body.nationality || "",
      description: req.body.description || "",
      movies
    });

    await syncActorMovies(actor._id, movies);

    res.status(201).json(actor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateActor = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.name !== undefined) {
      const name = normalizeName(payload.name || "");
      if (!name) {
        return res.status(400).json({ message: "Tên diễn viên là bắt buộc" });
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

    const actor = await Actor.findByIdAndUpdate(req.params.id, payload, {
      new: true
    });

    if (!actor) {
      return res.status(404).json({ message: "Diễn viên không tồn tại" });
    }

    if (payload.movies) {
      await syncActorMovies(actor._id, payload.movies);
    }

    res.json(actor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteActor = async (req, res) => {
  try {
    const actor = await Actor.findByIdAndDelete(req.params.id);
    if (!actor) {
      return res.status(404).json({ message: "Diễn viên không tồn tại" });
    }

    await Movie.updateMany(
      { cast: actor._id },
      { $pull: { cast: actor._id } }
    );

    res.json({ message: "Đã xóa diễn viên" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
