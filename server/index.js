// server/index.js

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

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
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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
  console.log(`[SafeLink][Server] 🌐 Listening on http://localhost:${PORT}`);
});

