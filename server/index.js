// server/index.js

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Ensure data directories exist
const dataDir = path.join(__dirname, "data");
const firstAidImagesDir = path.join(dataDir, "first-aid-images");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`[SafeLink][Server] 📁 Created data directory: ${dataDir}`);
}

if (!fs.existsSync(firstAidImagesDir)) {
  fs.mkdirSync(firstAidImagesDir, { recursive: true });
  console.log(`[SafeLink][Server] 📁 Created first-aid-images directory: ${firstAidImagesDir}`);
}

const messagesRouter = require("./routes/messages");
const peersRouter = require("./routes/peers");
const logsRouter = require("./routes/logs");
const rescuesRouter = require("./routes/rescues");
const helpRequestsRouter = require("./routes/helpRequests");
const firstAidRouter = require("./routes/firstAid");
const medaiRouter = require("./routes/medai");
const routesRouter = require("./routes/routes");
const locationUpdatesRouter = require("./routes/locationUpdates");
const weatherRouter = require("./routes/weather");
const configRouter = require("./routes/config");

const app = express();
const PORT = process.env.PORT || 4000;

// CORS configuration
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for now, can restrict in production
    }
  },
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({
    name: "SafeLink API",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/health",
      messages: "/api/messages",
      peers: "/api/peers",
      rescues: "/api/rescues",
      helpRequests: "/api/help-requests",
      firstAid: "/api/first-aid",
      medai: "/api/medai",
      routes: "/api/routes",
      locationUpdates: "/api/location-updates",
      weather: "/api/weather",
      config: "/api/config"
    }
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", ts: new Date().toISOString() });
});

app.use("/api/messages", messagesRouter);
app.use("/api/peers", peersRouter);
app.use("/logs", logsRouter);
app.use("/api/rescues", rescuesRouter);
app.use("/api/help-requests", helpRequestsRouter);
app.use("/api/first-aid", firstAidRouter);
app.use("/api/medai", medaiRouter);
app.use("/api/routes", routesRouter);
app.use("/api/location-updates", locationUpdatesRouter);
app.use("/api/weather", weatherRouter);
app.use("/api/config", configRouter);

app.listen(PORT, () => {
  console.log(`[SafeLink][Server] 🌐 Listening on port ${PORT}`);
  console.log(`[SafeLink][Server] 🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

