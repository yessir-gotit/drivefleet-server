const express = require("express");
const cors = require("cors");
const { auth, db } = require("./auth");
const { toNodeHandler } = require("better-auth/node");
const { splitCookiesString } = require("set-cookie-parser");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;


app.use(
  cors({
    origin: [
      "http://localhost:3000",
      process.env.FRONTEND_PRODUCTION_URL,
    ].filter(Boolean),
    credentials: true,
  }),
);

// Custom OAuth callback handler — returns 200 with cookies + HTML redirect
// instead of a 302 redirect, so browsers (Safari, Chrome ITP) store session cookies.
app.get("/api/auth/callback/{*any}", async (req, res) => {
  const proto = req.headers["x-forwarded-proto"] || (req.socket.encrypted ? "https" : "http");
  const base = `${proto}://${req.headers.host}`;

  // Let better-auth process the callback normally
  const response = await auth.handler(new Request(`${base}${req.originalUrl}`, {
    method: req.method,
    headers: req.headers,
  }));

  if (response.status === 302) {
    const location = response.headers.get("location");

    // Copy Set-Cookie headers from better-auth's response
    const setCookieHeader = response.headers.get("set-cookie");
    if (setCookieHeader) {
      const cookies = splitCookiesString(setCookieHeader);
      for (const cookie of cookies) {
        res.append("Set-Cookie", cookie);
      }
    }

    // Return 200 with HTML auto-redirect — cookies are stored by the browser
    res.status(200).send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Signing in...</title>
  <meta http-equiv="refresh" content="0;url=${location}">
</head>
<body>
  <script>window.location.href=${JSON.stringify(location)};</script>
</body>
</html>`);
  } else {
    // Pass through non-redirect responses as-is
    for (const [key, value] of response.headers) {
      res.setHeader(key, key === "set-cookie" ? splitCookiesString(value) : value);
    }
    res.status(response.status);
    if (response.body) {
      const reader = response.body.getReader();
      const pump = () => reader.read().then(({ done, value }) => {
        if (done) return res.end();
        res.write(value);
        pump();
      });
      pump();
    } else {
      res.end();
    }
  }
});

// All other /api/auth/* routes handled by better-auth normally
app.all("/api/auth/{*any}", toNodeHandler(auth));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get("/", (req, res) => {
  res.send("DriveFleet server running alongside Better Auth framework");
});

app.use("/api/cars", require("./routes/cars")(db));
app.use("/api/bookings", require("./routes/bookings")(db));


app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
