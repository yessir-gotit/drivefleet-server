import { Router } from "express";
import { ObjectId } from "mongodb";
import { requireAuth } from "../auth.js";

export default function (db) {
  const router = Router();

  router.post("/", requireAuth, async (req, res) => {
    try {
      const { carId, carName, carImage, dailyRate, driverNeeded, specialNote } =
        req.body;

      if (!carId || !carName) {
        return res
          .status(400)
          .json({ error: "Missing required booking fields." });
      }

      if (!ObjectId.isValid(carId)) {
        return res.status(400).json({ error: "Invalid car ID format." });
      }

      const car = await db
        .collection("cars")
        .findOne({ _id: new ObjectId(carId) });

      if (!car) {
        return res.status(404).json({ error: "Car not found." });
      }

      if (!car.isAvailable) {
        return res
          .status(409)
          .json({ error: "This car is currently unavailable." });
      }

      const booking = {
        carId,
        carName,
        carImage: carImage || car.imageUrl || "",
        dailyRate: Number(dailyRate) || Number(car.dailyRate),
        userId: req.user.id,
        userName: req.user.name,
        userEmail: req.user.email,
        driverNeeded: driverNeeded ?? false,
        specialNote: specialNote || "",
        bookingDate: new Date(),
        status: "confirmed",
        createdAt: new Date(),
      };

      const result = await db.collection("bookings").insertOne(booking);

      // Increment booking counter
      await db
        .collection("cars")
        .updateOne({ _id: new ObjectId(carId) }, { $inc: { bookedCount: 1 } });

      res.status(201).json({
        message: "Car booked successfully!",
        bookingId: result.insertedId.toString(),
      });
    } catch (err) {
      console.error("Error creating booking:", err);
      res
        .status(500)
        .json({ error: "Internal server error. Could not complete booking." });
    }
  });

  router.get("/user/me", requireAuth, async (req, res) => {
    try {
      const bookings = await db
        .collection("bookings")
        .find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .toArray();

      const formatted = bookings.map((b) => ({
        ...b,
        _id: b._id.toString(),
      }));

      res.status(200).json(formatted);
    } catch (err) {
      console.error("Error fetching user bookings:", err);
      res.status(500).json({
        error: "Internal server error. Could not fetch bookings.",
      });
    }
  });

  router.get("/user/:uid", requireAuth, async (req, res) => {
    try {
      const bookings = await db
        .collection("bookings")
        .find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .toArray();

      const formatted = bookings.map((b) => ({
        ...b,
        _id: b._id.toString(),
      }));

      res.status(200).json(formatted);
    } catch (err) {
      console.error("Error fetching user bookings:", err);
      res.status(500).json({
        error: "Internal server error. Could not fetch bookings.",
      });
    }
  });

  router.get("/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid booking ID format." });
      }

      const booking = await db
        .collection("bookings")
        .findOne({ _id: new ObjectId(id) });

      if (!booking) {
        return res.status(404).json({ error: "Booking not found." });
      }

      res.status(200).json({
        ...booking,
        _id: booking._id.toString(),
      });
    } catch (err) {
      console.error("Error fetching booking:", err);
      res
        .status(500)
        .json({ error: "Internal server error. Could not fetch booking." });
    }
  });

  return router;
};
