const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// middleware
app.use(cors({ origin: ['http://localhost:3000'], credentials: true }));
app.use(express.json());

const uri = process.env.MONGODB_URI;


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


async function connectDB() {
  try {
    await client.connect();
    console.log("Database Status: Connected successfully to MongoDB! ");
    

    const db = client.db("drivefleetDB");
    
  } catch (error) {
    console.error(" MongoDB Connection Failure:", error);
  }
}
connectDB().catch(console.dir);


app.get('/', (req, res) => {
    res.send('DriveFleet base server is operational.');
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});