const express = require('express');
const cors = require('cors');
const { auth } = require('./auth');
const { toNodeHandler } = require('better-auth/node');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: ['http://localhost:3000'], 
    credentials: true
}));
app.use(express.json());

app.all("/api/auth/*", toNodeHandler(auth));

app.get('/', (req, res) => {
    res.send('DriveFleet server running alongside Better Auth framework');
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});