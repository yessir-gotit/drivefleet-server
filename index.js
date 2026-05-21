import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { auth, db } from "./auth.js";
import { toNodeHandler } from "better-auth/node";
import "dotenv/config";
import carsRouterFactory from "./routes/cars.js";
import bookingsRouterFactory from "./routes/bookings.js";

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

app.use("/api/cars", carsRouterFactory(db));
app.use("/api/bookings", bookingsRouterFactory(db));

// Export for Vercel serverless (app.listen is also kept for local dev)
export default app;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
