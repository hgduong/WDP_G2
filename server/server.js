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
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");

app.use(authRoutes);
app.use(userRoutes);

app.use(passport.initialize());
const PORT = process.env.PORT || 9999;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
