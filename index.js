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


  const response = await auth.handler(new Request(`${base}${req.originalUrl}`, {
    method: req.method,
    headers: req.headers,
  }));

  if (response.status === 302) {
    const location = response.headers.get("location");


    const setCookieHeader = response.headers.get("set-cookie");
    if (setCookieHeader) {
      const cookies = splitCookiesString(setCookieHeader);
      for (const cookie of cookies) {
        res.append("Set-Cookie", cookie);
      }
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
