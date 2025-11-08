// server/routes/medai.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const MedAIController = require("../controllers/MedAIController");

// Configure multer for audio file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// POST /api/medai/process_text - Process text input
router.post("/process_text", MedAIController.processText);

// POST /api/medai/process_audio - Process audio input
router.post("/process_audio", upload.single("file"), MedAIController.processAudio);

module.exports = router;

