// controllers/actors.controller.js
const Actor = require("../models/actor");
const Movie = require("../models/movie");

const normalizeName = (value) => value.trim().replace(/\s+/g, " ");

exports.getAllActors = async (req, res) => {
  try {
    const actors = await Actor.aggregate([
      {
        $lookup: {
          from: "movies",
          let: { actorId: "$_id" },
          pipeline: [
            { $match: { $expr: { $in: ["$$actorId", "$cast"] } } },
            { $project: { _id: 1, title: 1 } }
          ],
          as: "movies"
        }
      }
    ]);
    res.json(actors);
    if (!actors){
      return res.status(404).json({message: "KhÃ´ng cÃ³ diá»…n viÃªn nÃ o"})
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getActorById = async (req, res) => {
  try {
    const actor = await Actor.findById(req.params.id);
    if (!actor) {
      return res.status(404).json({ message: "Diá»…n viÃªn khÃ´ng tá»“n táº¡i" });
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
      return res.status(400).json({ message: "TÃªn diá»…n viÃªn lÃ  báº¯t buá»™c" });
    }

    const nameLower = name.toLowerCase();
    const existing = await Actor.findOne({ nameLower });
    if (existing) {
      return res.status(400).json({ message: "Diá»…n viÃªn Ä‘Ã£ tá»“n táº¡i" });
    }

    const actor = await Actor.create({
      name,
      nameLower,
      dateOfBirth: req.body.dateOfBirth || null,
      gender: req.body.gender || null,
      nationality: req.body.nationality || "",
      description: req.body.description || "",
      movies: []
    });

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
        return res.status(400).json({ message: "TÃªn diá»…n viÃªn lÃ  báº¯t buá»™c" });
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

    const actor = await Actor.findByIdAndUpdate(req.params.id, payload, {
      new: true
    });

    if (!actor) {
      return res.status(404).json({ message: "Diá»…n viÃªn khÃ´ng tá»“n táº¡i" });
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
      return res.status(404).json({ message: "Diá»…n viÃªn khÃ´ng tá»“n táº¡i" });
    }

    await Movie.updateMany(
      { cast: actor._id },
      { $pull: { cast: actor._id } }
    );

    res.json({ message: "ÄÃ£ xÃ³a diá»…n viÃªn" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
