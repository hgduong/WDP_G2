const express = require("express");
const cors = require("cors");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");

require("./config/passport");

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);
app.use(passport.initialize());

connectDB();

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

const uploadRoutes = require("./routes/upload.route");
app.use("/api", uploadRoutes);
app.use("/upload", express.static("public/upload"));

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const moviesRoutes = require("./routes/movies.route");
const cinemaRoutes = require("./routes/cinema.routes");
const staffRoutes = require("./routes/staffs.route");

app.use(authRoutes);
app.use(userRoutes);
app.use(moviesRoutes);
app.use(cinemaRoutes);
app.use(staffRoutes);

const PORT = process.env.PORT || 9999;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
