const { betterAuth } = require("better-auth");
const { MongoClient } = require("mongodb");
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db("drivefleetDB");

const auth = betterAuth({
    database: {
        db: db,
        type: "mongodb"
    },

    trustedOrigins: [
        "http://localhost:3000", 
        process.env.FRONTEND_PRODUCTION_URL
    ],
    emailAndPassword: {
        enabled: true,
        autoSignIn: true
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET
        }
    }
});
module.exports = {auth};