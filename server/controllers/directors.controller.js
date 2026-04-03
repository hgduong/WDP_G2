// controllers/directors.controller.js
const Director = require("../models/director");
const Movie = require("../models/movie");

const normalizeName = (value) => value.trim().replace(/\s+/g, " ");

exports.getAllDirectors = async (req, res) => {
  try {
    const directors = await Director.aggregate([
      {
        $lookup: {
          from: "movies",
          let: { directorId: "$_id" },
          pipeline: [
            { $match: { $expr: { $in: ["$$directorId", "$directors"] } } },
            { $project: { _id: 1, title: 1 } }
          ],
          as: "movies"
        }
      }
    ]);

    if (!directors){
      return res.status(404).json({message: "Khong co dao dien nao"})
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
      return res.status(404).json({ message: "Äáº¡o diá»…n khÃ´ng tá»“n táº¡i" });
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
      return res.status(400).json({ message: "TÃªn Ä‘áº¡o diá»…n lÃ  báº¯t buá»™c" });
    }

    const nameLower = name.toLowerCase();
    const existing = await Director.findOne({ nameLower });
    if (existing) {
      return res.status(400).json({ message: "Äáº¡o diá»…n Ä‘Ã£ tá»“n táº¡i" });
    }

    const director = await Director.create({
      name,
      nameLower,
      dateOfBirth: req.body.dateOfBirth || null,
      gender: req.body.gender || null,
      nationality: req.body.nationality || "",
      description: req.body.description || "",
      movies: []
    });

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
        return res.status(400).json({ message: "TÃªn Ä‘áº¡o diá»…n lÃ  báº¯t buá»™c" });
      }
      payload.name = name;
      payload.nameLower = name.toLowerCase();
    }

    if (payload.movies !== undefined) {
      delete payload.movies;
    }

    if (payload.gender !== undefined) {
      payload.gender = payload.gender ? payload.gender : null;
    }

    const director = await Director.findByIdAndUpdate(req.params.id, payload, {
      new: true
    });

    if (!director) {
      return res.status(404).json({ message: "Äáº¡o diá»…n khÃ´ng tá»“n táº¡i" });
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
      return res.status(404).json({ message: "Äáº¡o diá»…n khÃ´ng tá»“n táº¡i" });
    }

    await Movie.updateMany(
      { directors: director._id },
      { $pull: { directors: director._id } }
    );

    res.json({ message: "ÄÃ£ xÃ³a Ä‘áº¡o diá»…n" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
