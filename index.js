const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { auth, db } = require("./auth");
const { toNodeHandler } = require("better-auth/node");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      process.env.FRONTEND_PRODUCTION_URL,
    ].filter(Boolean),
    credentials: true,
  }),
);
app.use(cookieParser());

app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("DriveFleet server running alongside Better Auth framework");
});

app.use("/api/cars", require("./routes/cars")(db));
app.use("/api/bookings", require("./routes/bookings")(db));

// Export for Vercel serverless (app.listen is also kept for local dev)
module.exports = app;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
