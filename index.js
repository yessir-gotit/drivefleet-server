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


app.all("/api/auth/*splat", toNodeHandler(auth));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('DriveFleet server running alongside Better Auth framework');
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});