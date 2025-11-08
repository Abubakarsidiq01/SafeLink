// server/routes/routes.js
const express = require("express");
const router = express.Router();
const RoutesController = require("../controllers/RoutesController");

// GET /api/routes - Find route to hospital or shelter
// Query params: ?lat=37.7749&lon=-122.4194&intent=hospital|safeplace
router.get("/", RoutesController.findRoute);

module.exports = router;

