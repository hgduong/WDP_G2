const express = require("express");
const app = express();
const connectDB = require("./config/db");
const cors = require("cors");
const passport = require("passport");
require("./config/passport");
const cookieParser = require("cookie-parser");
app.use(cookieParser());

app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

connectDB();

app.get("/", async (req, res) => {
  try {
    res.send({ message: "Welcome to Time Cinemas" });
  } catch (error) {
    res.send({ error: error.message });
  }
});

// --- API lấy danh sách tỉnh/thành phố ---
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

// --- API lấy danh sách quận/huyện theo province_id ---
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
// --- API lấy danh sách phường/xã theo district_id ---
app.get("/api/wards/:districtCode", async (req, res) => {
  try {
    const { districtCode } = req.params;
    const response = await fetch(
      `https://provinces.open-api.vn/api/d/${districtCode}?depth=2`,
    );
    const data = await response.json();
    res.json(data|| []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// upload anh
const uploadRoutes = require("./routes/upload.route");
app.use("/api", uploadRoutes);
app.use("/upload", express.static("public/upload")); // cho phép truy cập ảnh qua URL

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const moviesRoutes = require("./routes/movies.route");
app.use(authRoutes);
app.use(userRoutes);
app.use(moviesRoutes);

app.use(passport.initialize());
const PORT = process.env.PORT || 9999;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
