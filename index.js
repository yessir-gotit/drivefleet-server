const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// middleware setup
app.use(cors({
    origin: ['http://localhost:3000'],
    credentials: true 
}));
app.use(express.json());

// basic route
app.get('/', (req, res) => {
    res.send('DriveFleet server running');
});

app.listen(PORT, () => {
    console.log(`Server testing on port ${PORT}`);
});