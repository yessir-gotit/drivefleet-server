const { betterAuth } = require("better-auth");
const { mongodbAdapter } = require("better-auth/adapters/mongodb");
const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

const { waitUntil } = require("@vercel/functions");

const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: mongodbAdapter(db, { client }),

  trustedOrigins: [
    "http://localhost:3000",
    process.env.FRONTEND_PRODUCTION_URL,
  ].filter(Boolean),

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

  advanced: {
    useSecureCookies: true,
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    },
    backgroundTasks: {
      handler: waitUntil,
    },
  },
});

async function requireAuth(req, res, next) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.user = session.user;
    next();
  } catch (error) {
    console.error("requireAuth error:", error);
    return res.status(401).json({ error: "Unauthorized" });
  }
}

module.exports = { auth, db, requireAuth };
