// server/socket.js
const SocketIO = require("socket.io");

let io;

exports.init = (server) => {
  io = SocketIO(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Join a room for a specific showtime
    socket.on("join_showtime", (showtimeId) => {
      socket.join(`showtime_${showtimeId}`);
      console.log(`Socket ${socket.id} joined showtime_${showtimeId}`);
    });

    // Leave showtime room
    socket.on("leave_showtime", (showtimeId) => {
      socket.leave(`showtime_${showtimeId}`);
    });

    // Handle seat hold event
    socket.on("hold_seat", (data) => {
      const { showtimeId, seatId, userId, heldUntil } = data;
      // Broadcast to all clients in this showtime room
      io.to(`showtime_${showtimeId}`).emit("seat_held", {
        seatId,
        userId,
        heldUntil
      });
    });

    // Handle seat release event
    socket.on("release_seat", (data) => {
      const { showtimeId, seatId } = data;
      io.to(`showtime_${showtimeId}`).emit("seat_released", {
        seatId
      });
    });

    // Handle seat book event
    socket.on("book_seat", (data) => {
      const { showtimeId, seatId } = data;
      io.to(`showtime_${showtimeId}`).emit("seat_booked", {
        seatId
      });
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};

exports.getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
