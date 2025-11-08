// server/controllers/FirstAidController.js

const FirstAidModel = require("../models/FirstAidModel");

async function getFirstAidInstructions(req, res) {
  try {
    const { description, includeImages = true } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({
        error: "Missing description",
        message: "Please provide a description of the situation or injury",
      });
    }

    // Generate AI-powered first aid instructions (now async)
    const instructions = await FirstAidModel.generateFirstAidInstructions(description.trim(), includeImages);

    console.log(
      `[SafeLink][FirstAidController] ✅ First aid instructions generated for: ${description.substring(0, 50)}... (images: ${includeImages})`
    );

    res.json({
      success: true,
      instructions,
    });
  } catch (err) {
    console.error("[SafeLink][FirstAidController] ❌ Error:", err);
    res.status(500).json({
      error: "Failed to generate first aid instructions",
      message: err.message,
    });
  }
}

module.exports = {
  getFirstAidInstructions,
};

