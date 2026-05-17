const { betterAuth } = require("better-auth");
const { MongoClient } = require("mongodb");
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db("drivefleetDB");

export const auth = betterAuth({
    database: {
        db: db,
        type: "mongodb"
    },
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