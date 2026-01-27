const express = require("express");
const app = express();
const connectDB = require("./config/db");
const cors = require("cors");
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
const PORT = process.env.PORT || 9999;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
