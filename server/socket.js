const SocketIO = require("socket.io");

let io;

const roomNameForShowtime = (showtimeId) => `showtime_${showtimeId}`;

exports.init = (server) => {
  io = SocketIO(server, {
    cors: {
      origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join_showtime", (showtimeId) => {
      if (!showtimeId) {
        return;
      }

      socket.join(roomNameForShowtime(showtimeId));
    });

    socket.on("leave_showtime", (showtimeId) => {
      if (!showtimeId) {
        return;
      }

      socket.leave(roomNameForShowtime(showtimeId));
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};

exports.getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }

  return io;
};

exports.roomNameForShowtime = roomNameForShowtime;

exports.emitShowtimeSeatsChanged = (showtimeId, meta = {}) => {
  if (!io || !showtimeId) {
    return;
  }

  io.to(roomNameForShowtime(showtimeId)).emit("showtime_seats_changed", {
    showtimeId: showtimeId.toString(),
    ...meta,
    emittedAt: new Date().toISOString(),
  });
};
