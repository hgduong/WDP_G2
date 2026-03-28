const Showtime = require("../models/showtime");
const Room = require("../models/room");
const Movie = require("../models/movie");
const Seatmap = require("../models/seatmap");
const Seat = require("../models/seat");

/**
 * Auto-generate showtimes for the next N days
 * Uses EXISTING showtimes as templates:
 *   - For each active (movie, room) combination with scheduled showtimes
 *   - Extract the time-of-day (HH:MM) slots
 *   - Replicate those slots for every day in the next N days that doesn't already have them
 */
async function generateShowtimes(days = 7) {
  console.log("[ShowtimeScheduler] Bắt đầu kiểm tra suất chiếu...");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetEndDate = new Date(today);
  targetEndDate.setDate(targetEndDate.getDate() + days);
  targetEndDate.setHours(23, 59, 59, 999);

  // 1. Fetch ALL scheduled showtimes (we use these as templates)
  const allScheduled = await Showtime.find({ status: "Scheduled" })
    .populate("movieId")
    .populate("roomId");

  if (allScheduled.length === 0) {
    console.log("[ShowtimeScheduler] Không có suất chiếu nào. Bỏ qua.");
    return { created: 0, skipped: 0 };
  }

  // 2. Build templates: group by (movieId, roomId) and collect unique time slots
  //    Key format: "movieId_roomId"
  const templateMap = new Map();

  for (const st of allScheduled) {
    const movie = st.movieId;
    const room = st.roomId;
    if (!movie || !room) continue;
    if (movie.status === "Ended") continue;

    const key = `${movie._id}_${room._id}`;
    const stDate = new Date(st.startTime);
    const timeSlot = `${String(stDate.getHours()).padStart(2, "0")}:${String(stDate.getMinutes()).padStart(2, "0")}`;

    if (!templateMap.has(key)) {
      templateMap.set(key, {
        movieId: movie._id,
        movie,
        roomId: room._id,
        room,
        duration: st.duration || movie.duration || 120,
        language: st.language || movie.language || "Tiếng Việt",
        timeSlots: new Set(),
      });
    }

    templateMap.get(key).timeSlots.add(timeSlot);
  }

  if (templateMap.size === 0) {
    console.log("[ShowtimeScheduler] Không có template hợp lệ. Bỏ qua.");
    return { created: 0, skipped: 0 };
  }

  // 3. Collect existing showtime keys in the target range to avoid duplicates
  const existingInRange = await Showtime.find({
    status: "Scheduled",
    startTime: { $gte: today, $lte: targetEndDate },
  }).select("movieId roomId startTime");

  const existingSet = new Set(
    existingInRange.map((s) => {
      const d = new Date(s.startTime);
      const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      return `${s.movieId}_${s.roomId}_${d.toISOString().split("T")[0]}_${time}`;
    })
  );

  console.log(`[ShowtimeScheduler] Tìm thấy ${templateMap.size} template (phim+phòng), ${existingInRange.length} suất đã có trong ${days} ngày tới.`);

  // 4. Generate showtimes for each day
  let created = 0;
  let skipped = 0;

  for (const [, template] of templateMap) {
    const { movieId, movie, roomId, room, duration, language, timeSlots } = template;

    // Check movie endDate
    const movieEndDate = movie.endDate ? new Date(movie.endDate) : null;
    if (movieEndDate) movieEndDate.setHours(23, 59, 59, 999);

    const currentDate = new Date(today);
    while (currentDate <= targetEndDate) {
      // Skip if movie has ended
      if (movieEndDate && currentDate > movieEndDate) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      const dateStr = currentDate.toISOString().split("T")[0];

      for (const timeSlot of timeSlots) {
        const key = `${movieId}_${roomId}_${dateStr}_${timeSlot}`;

        if (existingSet.has(key)) {
          skipped++;
          continue;
        }

        const [hours, minutes] = timeSlot.split(":");
        const startTime = new Date(currentDate);
        startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // Create showtime
        const showtime = await Showtime.create({
          movieId,
          roomId,
          startTime,
          duration,
          language,
          status: "Scheduled",
        });

        // Link to movie
        await Movie.findByIdAndUpdate(movieId, {
          $push: { showtimes: showtime._id },
        });

        existingSet.add(key);
        created++;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  console.log(`[ShowtimeScheduler] Hoàn tất: ${created} suất chiếu mới, ${skipped} bỏ qua (đã có).`);
  return { created, skipped };
}

/**
 * Start the scheduler
 * - Auto-generation disabled: showtimes are created manually only
 */
function startScheduler() {
  // Auto-generation disabled: showtimes are created manually only
  console.log("[ShowtimeScheduler] Đã khởi động - tự động tạo suất chiếu đã bị tắt.");
}

module.exports = { generateShowtimes, startScheduler };
