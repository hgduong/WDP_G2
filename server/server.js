require('node:dns').setServers(['8.8.8.8', '8.8.4.4']);
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const http = require("http");
const connectDB = require("./config/db");

const socketIO = require("./socket");
require("./config/passport");

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
socketIO.init(server);

app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);
app.use(passport.initialize());

connectDB();

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC ROUTES (No authentication required)
// ═══════════════════════════════════════════════════════════════════════════════

// Welcome route
app.get("/", async (req, res) => {
  try {
    res.send({ message: "Welcome to Time Cinemas" });
  } catch (error) {
    res.send({ error: error.message });
  }
});

// Location API routes (Provinces, Districts, Wards)
app.get("/api/provinces", async (req, res) => {
  try {
    const response = await fetch("https://provinces.open-api.vn/api/v1/");
    const data = await response.json();

    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

app.get("/api/districts/:provinceCode", async (req, res) => {
  try {
    const { provinceCode } = req.params;
    const response = await fetch(
      `https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`,
    );
    const data = await response.json();
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/wards/:districtCode", async (req, res) => {
  try {
    const { districtCode } = req.params;
    const response = await fetch(
      `https://provinces.open-api.vn/api/d/${districtCode}?depth=2`,
    );
    const data = await response.json();
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Static files
app.use("/upload", express.static("public/upload"));

// QR Code routes
const qrcodeRoutes = require("./routes/qrcode.routes");
app.use("/qrcode", qrcodeRoutes);

// Upload routes
const uploadRoutes = require("./routes/upload.route");
app.use("/api/upload", uploadRoutes);

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH ROUTES (Login, Register, OTP, etc.)
// Prefix: /api/auth
// ═══════════════════════════════════════════════════════════════════════════════

const authRoutes = require("./routes/auth.routes");
app.use("/api/auth", authRoutes);

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC DATA ROUTES (Movies, Cinemas, Vouchers - public access)
// ═══════════════════════════════════════════════════════════════════════════════

const moviesRoutes = require("./routes/movies.route");
app.use("/api/movies", moviesRoutes);

const cinemaRoutes = require("./routes/cinema.routes");
app.use("/api/cinemas", cinemaRoutes);

const voucherRoutes = require("./routes/voucher.routes");
app.use("/api/vouchers", voucherRoutes);

// ═══════════════════════════════════════════════════════════════════════════════
// AUTHENTICATED ROUTES (Require JWT token)
// ═══════════════════════════════════════════════════════════════════════════════

const userRoutes = require("./routes/user.routes");
app.use("/api/users", userRoutes);

const bookingRoutes = require("./routes/booking.route");
app.use("/api/bookings", bookingRoutes);

const transactionRoutes = require("./routes/transaction.routes");
app.use("/api/transactions", transactionRoutes);

const staffRoutes = require("./routes/staffs.route");
app.use("/api/staff", staffRoutes);

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES (Require Admin role)
// ═══════════════════════════════════════════════════════════════════════════════

const seatsRoutes = require("./routes/seats.route");
app.use("/api/seats", seatsRoutes);

const scheduleRoutes = require("./routes/schedule.routes");
app.use("/api/schedules", scheduleRoutes);

// ═══════════════════════════════════════════════════════════════════════════════
// SERVER START
// ═══════════════════════════════════════════════════════════════════════════════

const PORT = process.env.PORT || 9999;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
