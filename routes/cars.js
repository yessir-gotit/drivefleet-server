import { Router } from "express";
import { ObjectId } from "mongodb";
import { requireAuth } from "../auth.js";

export default function (db) {
  const router = Router();

  router.get("/user/:uid", async (req, res) => {
    try {
      const { uid } = req.params;

      if (!uid) {
        return res.status(400).json({ error: "User ID is required." });
      }

      const cars = await db
        .collection("cars")
        .find({ userId: uid })
        .sort({ createdAt: -1 })
        .toArray();

      const formatted = cars.map((car) => ({
        ...car,
        _id: car._id.toString(),
      }));

      res.status(200).json(formatted);
    } catch (err) {
      console.error("Error fetching user cars:", err);
      res
        .status(500)
        .json({ error: "Internal server error. Could not fetch user cars." });
    }
  });

  router.get("/", async (req, res) => {
    try {
      const { carType, search, isAvailable } = req.query;

      const filter = {};

      if (carType && carType !== "all") {
        filter.carType = carType;
      }

      if (search) {
        filter.carName = { $regex: search, $options: "i" };
      }

      if (isAvailable !== undefined) {
        filter.isAvailable = isAvailable === "true";
      }

      const cars = await db
        .collection("cars")
        .find(filter)
        .sort({ createdAt: -1 })
        .toArray();

      const formatted = cars.map((car) => ({
        ...car,
        _id: car._id.toString(),
      }));

      res.status(200).json(formatted);
    } catch (err) {
      console.error("Error fetching cars:", err);
      res
        .status(500)
        .json({ error: "Internal server error. Could not fetch cars." });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid car ID format." });
      }

      const car = await db
        .collection("cars")
        .findOne({ _id: new ObjectId(id) });

      if (!car) {
        return res.status(404).json({ error: "Car not found." });
      }

      res.status(200).json({
        ...car,
        _id: car._id.toString(),
      });
    } catch (err) {
      console.error("Error fetching car:", err);
      res
        .status(500)
        .json({ error: "Internal server error. Could not fetch car." });
    }
  });

  router.post("/", requireAuth, async (req, res) => {
    try {
      const {
        carName,
        dailyRate,
        carType,
        imageUrl,
        seatCapacity,
        pickupLocation,
        description,
        isAvailable,
      } = req.body;

      if (
        !carName ||
        !dailyRate ||
        !carType ||
        !imageUrl ||
        !seatCapacity ||
        !pickupLocation ||
        !description
      ) {
        return res
          .status(400)
          .json({ error: "All required fields must be provided." });
      }

      const car = {
        carName,
        dailyRate: Number(dailyRate),
        carType,
        imageUrl,
        seatCapacity: Number(seatCapacity),
        pickupLocation,
        description,
        isAvailable: isAvailable ?? true,
        bookedCount: 0,
        userId: req.user.id,
        createdAt: new Date(),
      };

      const result = await db.collection("cars").insertOne(car);

      res.status(201).json({
        message: "Car added to fleet successfully!",
        carId: result.insertedId,
      });
    } catch (err) {
      console.error("Error adding car:", err);
      res
        .status(500)
        .json({ error: "Internal server error. Could not add car." });
    }
  });

  router.put("/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const {
        carName,
        dailyRate,
        carType,
        imageUrl,
        seatCapacity,
        pickupLocation,
        description,
        isAvailable,
      } = req.body;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid car ID format." });
      }

      const existing = await db
        .collection("cars")
        .findOne({ _id: new ObjectId(id) });

      if (!existing) {
        return res.status(404).json({ error: "Car not found." });
      }

      if (existing.userId !== req.user.id) {
        return res
          .status(403)
          .json({ error: "Unauthorized to edit this car." });
      }

      const update = {};
      if (carName) update.carName = carName;
      if (dailyRate) update.dailyRate = Number(dailyRate);
      if (carType) update.carType = carType;
      if (imageUrl) update.imageUrl = imageUrl;
      if (seatCapacity) update.seatCapacity = Number(seatCapacity);
      if (pickupLocation) update.pickupLocation = pickupLocation;
      if (description) update.description = description;
      if (isAvailable !== undefined) update.isAvailable = isAvailable;

      await db
        .collection("cars")
        .updateOne({ _id: new ObjectId(id) }, { $set: update });

      const updated = await db
        .collection("cars")
        .findOne({ _id: new ObjectId(id) });

      res.status(200).json({
        message: "Car updated successfully!",
        car: { ...updated, _id: updated._id.toString() },
      });
    } catch (err) {
      console.error("Error updating car:", err);
      res
        .status(500)
        .json({ error: "Internal server error. Could not update car." });
    }
  });

  router.delete("/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid car ID format." });
      }

      const car = await db
        .collection("cars")
        .findOne({ _id: new ObjectId(id) });

      if (!car) {
        return res.status(404).json({ error: "Car not found." });
      }

      if (car.userId !== req.user.id) {
        return res
          .status(403)
          .json({ error: "Unauthorized to delete this car." });
      }

      await db.collection("cars").deleteOne({ _id: new ObjectId(id) });

      res.status(200).json({ message: "Car deleted successfully." });
    } catch (err) {
      console.error("Error deleting car:", err);
      res
        .status(500)
        .json({ error: "Internal server error. Could not delete car." });
    }
  });

  return router;
};
