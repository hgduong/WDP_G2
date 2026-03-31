// seed.js - Script to populate MongoDB with sample data
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const seedData = require('./data/seed.json');

// Import models
const Movie = require('./models/movie');
const Cinema = require('./models/cinema');
const Room = require('./models/room');
const Showtime = require('./models/showtime');
const User = require('./models/user');
const Actor = require('./models/actor');
const Director = require('./models/director');

dotenv.config();

const connectDB = require('./config/db');

const normalizeName = (value) => value.trim().replace(/\s+/g, ' ');
const parseNames = (value) =>
  value
    .split(',')
    .map((item) => normalizeName(item))
    .filter(Boolean);

const getOrCreateActor = async (name, cache) => {
  const key = name.toLowerCase();
  if (cache.has(key)) return cache.get(key);
  let actor = await Actor.findOne({ nameLower: key });
  if (!actor) {
    actor = await Actor.create({ name, nameLower: key });
  }
  cache.set(key, actor._id);
  return actor._id;
};

const getOrCreateDirector = async (name, cache) => {
  const key = name.toLowerCase();
  if (cache.has(key)) return cache.get(key);
  let director = await Director.findOne({ nameLower: key });
  if (!director) {
    director = await Director.create({ name, nameLower: key });
  }
  cache.set(key, director._id);
  return director._id;
};

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Clear existing data
    await Movie.deleteMany({});
    await Cinema.deleteMany({});
    await Room.deleteMany({});
    await Showtime.deleteMany({});
    await User.deleteMany({});
    await Actor.deleteMany({});
    await Director.deleteMany({});
    console.log('Cleared existing data');

    // Seed Cinemas
    const cinemas = await Cinema.insertMany(seedData.cinemas);
    console.log(`Seeded ${cinemas.length} cinemas`);

    // Seed Rooms
    const roomsData = seedData.rooms.map(room => ({
      ...room,
      cinemaId: cinemas[room.cinemaIndex]._id
    }));
    delete roomsData.roomIndex;

    const rooms = await Room.insertMany(roomsData);
    console.log(`Seeded ${rooms.length} rooms`);

    // Update cinemas with room references
    for (let i = 0; i < seedData.rooms.length; i++) {
      const room = rooms[i];
      const cinemaIndex = seedData.rooms[i].cinemaIndex;
      await Cinema.findByIdAndUpdate(cinemas[cinemaIndex]._id, {
        $push: { rooms: room._id }
      });
    }

    const actorCache = new Map();
    const directorCache = new Map();

    const moviesData = [];
    for (const movie of seedData.movies) {
      const payload = { ...movie };

      if (typeof movie.cast === 'string') {
        const names = parseNames(movie.cast);
        payload.cast = [];
        for (const name of names) {
          const actorId = await getOrCreateActor(name, actorCache);
          payload.cast.push(actorId);
        }
      }

      if (typeof movie.director === 'string') {
        const names = parseNames(movie.director);
        payload.directors = [];
        for (const name of names) {
          const directorId = await getOrCreateDirector(name, directorCache);
          payload.directors.push(directorId);
        }
        delete payload.director;
      }

      moviesData.push(payload);
    }

    // Seed Movies
    const movies = await Movie.insertMany(moviesData);
    console.log(`Seeded ${movies.length} movies`);

    // Seed Showtimes
    const showtimesData = seedData.showtimes.map(showtime => ({
      movieId: movies[showtime.movieIndex]._id,
      roomId: rooms[showtime.roomIndex]._id,
      startTime: showtime.startTime,
      language: showtime.language,
      status: showtime.status
    }));

    const showtimes = await Showtime.insertMany(showtimesData);
    console.log(`Seeded ${showtimes.length} showtimes`);

    // Update movies with showtime references
    for (let i = 0; i < showtimes.length; i++) {
      const showtime = showtimes[i];
      const showtimeData = seedData.showtimes[i];

      await Movie.findByIdAndUpdate(movies[showtimeData.movieIndex]._id, {
        $push: { showtimes: showtime._id }
      });
    }

    // Seed Admin User
    const adminUser = await User.create({
      email: seedData.users[0].email,
      password: seedData.users[0].password,
      fullName: seedData.users[0].fullName,
      phone: seedData.users[0].phone,
      role: seedData.users[0].role
    });
    console.log(`Seeded admin user: ${adminUser.email}`);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
