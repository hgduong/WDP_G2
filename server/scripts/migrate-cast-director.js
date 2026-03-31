// scripts/migrate-cast-director.js
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Actor = require("../models/actor");
const Director = require("../models/director");

const normalizeName = (value) => value.trim().replace(/\s+/g, " ");

const parseNames = (value) =>
  value
    .split(",")
    .map((item) => normalizeName(item))
    .filter(Boolean);

const getOrCreateActor = async (name, cache) => {
  const nameLower = name.toLowerCase();
  if (cache.has(nameLower)) return cache.get(nameLower);

  let actor = await Actor.findOne({ nameLower });
  if (!actor) {
    actor = await Actor.create({ name, nameLower });
  }
  cache.set(nameLower, actor._id);
  return actor._id;
};

const getOrCreateDirector = async (name, cache) => {
  const nameLower = name.toLowerCase();
  if (cache.has(nameLower)) return cache.get(nameLower);

  let director = await Director.findOne({ nameLower });
  if (!director) {
    director = await Director.create({ name, nameLower });
  }
  cache.set(nameLower, director._id);
  return director._id;
};

const run = async () => {
  try {
    await connectDB();
    const db = mongoose.connection;
    const collection = db.collection("movies");

    const actorCache = new Map();
    const directorCache = new Map();
    let updated = 0;

    const cursor = collection.find({});
    for await (const movie of cursor) {
      const updates = {};

      if (typeof movie.cast === "string") {
        const names = parseNames(movie.cast);
        const actorIds = [];
        for (const name of names) {
          const actorId = await getOrCreateActor(name, actorCache);
          actorIds.push(actorId);
        }
        updates.cast = actorIds;
      }

      // Migrate legacy "director" field to new "directors" array.
      // Legacy data may store:
      // - String of names (comma-separated)
      // - ObjectId of Director
      if (movie.director !== undefined) {
        if (typeof movie.director === "string") {
          const names = parseNames(movie.director || "");
          const directorIds = [];
          for (const name of names) {
            const directorId = await getOrCreateDirector(name, directorCache);
            directorIds.push(directorId);
          }
          updates.directors = directorIds;
          updates.director = undefined;
        } else if (mongoose.isValidObjectId(movie.director)) {
          updates.directors = [movie.director];
          updates.director = undefined;
        }
      }

      if (Object.keys(updates).length > 0) {
        const $set = { ...updates };
        const $unset = {};
        if ($set.director === undefined) {
          delete $set.director;
          $unset.director = "";
        }
        const op = {};
        if (Object.keys($set).length > 0) op.$set = $set;
        if (Object.keys($unset).length > 0) op.$unset = $unset;
        await collection.updateOne({ _id: movie._id }, op);
        updated += 1;
      }
    }

    // Sync ngược: Movie.cast/directors[] <-> Actor.movies/Director.movies
    // Mục tiêu: đảm bảo màn Quản lý diễn viên/đạo diễn hiển thị đúng theo dữ liệu trong movies.
    const actorMovieMap = new Map(); // actorId -> Set(movieId)
    const directorMovieMap = new Map(); // directorId -> Set(movieId)

    const cursor2 = collection.find({});
    for await (const movie of cursor2) {
      const movieId = String(movie._id);

      const castArr = Array.isArray(movie.cast) ? movie.cast : [];
      for (const actorIdRaw of castArr) {
        const actorId = String(actorIdRaw);
        if (!mongoose.isValidObjectId(actorId)) continue;
        if (!actorMovieMap.has(actorId)) actorMovieMap.set(actorId, new Set());
        actorMovieMap.get(actorId).add(movieId);
      }

      const directorsArr = Array.isArray(movie.directors) ? movie.directors : [];
      for (const directorIdRaw of directorsArr) {
        const directorId = String(directorIdRaw);
        if (!mongoose.isValidObjectId(directorId)) continue;
        if (!directorMovieMap.has(directorId)) directorMovieMap.set(directorId, new Set());
        directorMovieMap.get(directorId).add(movieId);
      }

      // Safety fallback: nếu movies chưa có directors[] mà còn giữ legacy director
      if ((!Array.isArray(movie.directors) || movie.directors.length === 0) && movie.director) {
        if (mongoose.isValidObjectId(movie.director)) {
          const directorId = String(movie.director);
          if (!directorMovieMap.has(directorId)) directorMovieMap.set(directorId, new Set());
          directorMovieMap.get(directorId).add(movieId);
        }
      }
    }

    await Actor.updateMany({}, { $set: { movies: [] } });
    await Director.updateMany({}, { $set: { movies: [] } });

    const actorBulk = [];
    for (const [actorId, movieSet] of actorMovieMap.entries()) {
      actorBulk.push({
        updateOne: {
          filter: { _id: actorId },
          update: { $set: { movies: Array.from(movieSet) } }
        }
      });
    }

    const directorBulk = [];
    for (const [directorId, movieSet] of directorMovieMap.entries()) {
      directorBulk.push({
        updateOne: {
          filter: { _id: directorId },
          update: { $set: { movies: Array.from(movieSet) } }
        }
      });
    }

    if (actorBulk.length > 0) await Actor.bulkWrite(actorBulk);
    if (directorBulk.length > 0) await Director.bulkWrite(directorBulk);

    console.log(`Migration complete. Updated ${updated} movie(s). Synced Actor/Director movies.`);
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

run();
