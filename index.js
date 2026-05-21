const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { auth, db } = require("./auth");
const { toNodeHandler } = require("better-auth/node");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;


function splitCookiesString(setCookieHeader) {
  if (!setCookieHeader) return [];
  if (Array.isArray(setCookieHeader)) return setCookieHeader;

  const cookies = [];
  let start = 0;
  for (let i = 0; i < setCookieHeader.length; i++) {
    if (setCookieHeader[i] === ",") {
      const part = setCookieHeader.substring(start, i).trim();
      if (part) cookies.push(part);
      start = i + 1;
    }
  }
  const last = setCookieHeader.substring(start).trim();
  if (last) cookies.push(last);
  return cookies;
}

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      process.env.FRONTEND_PRODUCTION_URL,
    ].filter(Boolean),
    credentials: true,
  }),
);
app.use(cookieParser());

app.get("/api/auth/callback/{*any}", async (req, res) => {
  const proto = req.headers["x-forwarded-proto"] || (req.socket.encrypted ? "https" : "http");
  const base = `${proto}://${req.headers.host}`;

  const requestUrl = `${base}${req.originalUrl}`;
  console.log(`[OAuth Callback] Request URL: ${requestUrl}`);

  const response = await auth.handler(new Request(requestUrl, {
    method: req.method,
    headers: req.headers,
  }));

  console.log(`[OAuth Callback] Response status: ${response.status}`);

  // Log all response headers to see what better-auth returns
  console.log(`[OAuth Callback] All response headers:`);
  for (const [key, value] of response.headers) {
    console.log(`[OAuth Callback]   Header: ${key} = ${value}`);
  }

  // Log raw set-cookie via .get() to see the joined string
  const rawSetCookie = response.headers.get("set-cookie");
  console.log(`[OAuth Callback] Raw set-cookie (via .get()): ${rawSetCookie}`);

  if (response.status === 302) {
    const location = response.headers.get("location");
    console.log(`[OAuth Callback] 302 Location: ${location}`);

    if (rawSetCookie) {
      const cookies = splitCookiesString(rawSetCookie);
      console.log(`[OAuth Callback] Parsed cookies (${cookies.length}):`);
      cookies.forEach((c, i) => console.log(`[OAuth Callback]   Cookie[${i}]: ${c}`));
      for (const cookie of cookies) {
        res.append("Set-Cookie", cookie);
      }
    } else {
      console.log(`[OAuth Callback] No set-cookie header found in 302 response`);
    }

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
    console.log(`[OAuth Callback] Non-302 response, forwarding headers and body`);
    for (const [key, value] of response.headers) {
      const processed = key === "set-cookie" ? splitCookiesString(value) : value;
      console.log(`[OAuth Callback]   Setting header ${key}: ${key === "set-cookie" ? JSON.stringify(processed) : value}`);
      res.setHeader(key, processed);
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
