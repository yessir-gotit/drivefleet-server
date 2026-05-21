const { betterAuth } = require("better-auth");
const { MongoClient } = require("mongodb");
const { mongodbAdapter } = require("@better-auth/mongo-adapter");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db("drivefleetDB");

const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: mongodbAdapter(db, {
    client: client,
  }),

  trustedOrigins: [
    "http://localhost:3000",
    process.env.FRONTEND_PRODUCTION_URL,
  ],
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
  account: {
    storeStateStrategy: "database",
    skipStateCookieCheck: true,
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
    },
  },
});

async function requireAuth(req, res, next) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    req.user = session.user;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

module.exports = { auth, db, requireAuth };
