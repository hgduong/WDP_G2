require('node:dns').setServers(['8.8.8.8', '8.8.4.4']);
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const http = require("http");
const connectDB = require("./config/db");
const socketIO = require("./socket");
const { startScheduler, generateShowtimes } = require("./utils/showtimeScheduler");
const { authenticateToken, authorizeRoles } = require("./config/auth.middleware");
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

connectDB().then(() => {
  // Start auto-generating showtimes after DB connection
  startScheduler();
});

app.get("/", async (req, res) => {
  try {
    res.send({ message: "Welcome to Time Cinemas" });
  } catch (error) {
    res.send({ error: error.message });
  }
});

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

// Manual trigger: generate showtimes for next N days (Admin only)
app.post("/api/showtimes/generate", authenticateToken, authorizeRoles(["Admin"]), async (req, res) => {
  try {
    const days = parseInt(req.body.days) || 7;
    const result = await generateShowtimes(days);
    res.json({
      message: `Đã tạo ${result.created} suất chiếu mới, bỏ qua ${result.skipped} suất đã có.`,
      ...result,
    });
  } catch (error) {
    console.error("Lỗi khi tạo suất chiếu:", error);
    res.status(500).json({ message: "Lỗi server khi tạo suất chiếu" });
  }
});

const uploadRoutes = require("./routes/upload.route");
app.use("/api", uploadRoutes);
app.use("/upload", express.static("public/upload"));

const qrcodeRoutes = require("./routes/qrcode.routes");
app.use("/qrcode", qrcodeRoutes);

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const moviesRoutes = require("./routes/movies.route");
const cinemaRoutes = require("./routes/cinema.routes");
const staffRoutes = require("./routes/staffs.route");
const voucherRoutes = require("./routes/voucher.routes");
const seatsRoutes = require("./routes/seats.route");
const bookingRoutes = require("./routes/booking.route");
const transactionRoutes = require("./routes/transaction.routes");
const scheduleRoutes = require("./routes/schedule.routes");

app.use(authRoutes);

app.use(userRoutes);

app.use(moviesRoutes);

app.use(cinemaRoutes);

app.use("/transactions", transactionRoutes);

app.use(staffRoutes);
app.use("/api", seatsRoutes);
app.use("/api", bookingRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api", transactionRoutes);
// Đăng ký voucher routes tại /vouchers (cùng cấp với các routes khác)
app.use("/vouchers", voucherRoutes);

const PORT = process.env.PORT || 9999;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
