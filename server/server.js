const express = require("express");
const app = express();
const connectDB = require("./config/db");
const cors = require("cors");
const passport = require("passport");
const FacebookStrategy = require("passport-facebook").Strategy;
const { ConfigPassport } = require("./controllers/passport.controller");
const jwt = require("jsonwebtoken");

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
const routes = require("./routes/all.routes");
app.use(routes);

ConfigPassport();

// app.get("/auth/facebook/callback",
//   passport.authenticate("facebook", { session: false }),
//   (req, res) => {
//     // xử lý sau khi login thành công
//     res.json({ user: req.user });
//   }
// );
app.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", {
    session: false,
    failureRedirect:
      "http://localhost:3000/login?error=Facebook%20login%20failed",
  }),
  (req, res) => {
    if (!req.user) {
      return res.redirect(
        "http://localhost:3000/login?error=Không%20thể%20lấy%20email%20từ%20facebook",
      );
    }

    const token = jwt.sign(
      {
        id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        role: req.user.role,
        avatarUrl: req.user.avatarUrl || null,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.redirect(`http://localhost:3000/?token=${token}`);
  },
);

const PORT = process.env.PORT || 9999;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
