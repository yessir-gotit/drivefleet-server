const express = require('express');
const cors = require('cors');
const { auth, db } = require('./auth'); 
const { toNodeHandler } = require('better-auth/node');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: ['http://localhost:3000'],
    credentials: true
}));

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('DriveFleet server running alongside Better Auth framework');
});

//  POST /api/cars route 
app.post('/api/cars', async (req, res) => {
  try {
    const { carName, dailyRate, carType, imageUrl, seatCapacity, pickupLocation, description, isAvailable } = req.body;

    //  server side validation
    if (!carName || !dailyRate || !carType || !imageUrl || !seatCapacity || !pickupLocation || !description) {
      return res.status(400).json({ error: 'All required fields must be provided.' });
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
      createdAt: new Date(),
    };

    const result = await db.collection('cars').insertOne(car);

    res.status(201).json({
      message: 'Car added to fleet successfully!',
      carId: result.insertedId,
    });
  } catch (err) {
    console.error('Error adding car:', err);
    res.status(500).json({ error: 'Internal server error. Could not add car.' });
  }
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
