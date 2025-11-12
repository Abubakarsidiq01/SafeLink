// server/routes/weather.js

const express = require("express");
const router = express.Router();
const axios = require("axios");

// OpenWeatherMap API (free tier) - optional, falls back to Open-Meteo if not available
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";

// Open-Meteo API (free, no key required) - fallback option
const OPENMETEO_BASE_URL = "https://api.open-meteo.com/v1";

/**
 * Get weather alerts for a location
 * Uses OpenWeatherMap if API key is available, otherwise falls back to Open-Meteo
 */
router.get("/alerts", async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        error: "Latitude and longitude are required",
        message: "Please provide lat and lon query parameters",
      });
    }

    let alerts = [];

    // Try OpenWeatherMap first if API key is available
    if (OPENWEATHER_API_KEY) {
      try {
        const response = await axios.get(
          `${OPENWEATHER_BASE_URL}/onecall`,
          {
            params: {
              lat: parseFloat(lat),
              lon: parseFloat(lon),
              appid: OPENWEATHER_API_KEY,
              exclude: "current,minutely,hourly,daily",
            },
            timeout: 5000,
          }
        );

        if (response.data?.alerts) {
          alerts = response.data.alerts.map((alert) => ({
            id: `owm-${alert.start}-${alert.end}`,
            title: alert.event,
            description: alert.description,
            severity: alert.severity || "moderate",
            startTime: new Date(alert.start * 1000).toISOString(),
            endTime: new Date(alert.end * 1000).toISOString(),
            source: "OpenWeatherMap",
            tags: alert.tags || [],
          }));
        }
      } catch (error) {
        console.log("[Weather] OpenWeatherMap error, trying fallback:", error.message);
      }
    }

    // Fallback to Open-Meteo if no alerts from OpenWeatherMap or no API key
    if (alerts.length === 0) {
      try {
        // Get severe weather warnings from Open-Meteo
        const response = await axios.get(
          `${OPENMETEO_BASE_URL}/severe-weather`,
          {
            params: {
              latitude: parseFloat(lat),
              longitude: parseFloat(lon),
              timezone: "auto",
            },
            timeout: 5000,
          }
        );

        if (response.data?.warnings) {
          alerts = response.data.warnings.map((warning, index) => ({
            id: `om-${warning.start}-${index}`,
            title: warning.event || "Weather Warning",
            description: warning.description || warning.event || "Severe weather conditions expected",
            severity: warning.severity || "moderate",
            startTime: warning.start || new Date().toISOString(),
            endTime: warning.end || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            source: "Open-Meteo",
            tags: [warning.event] || [],
          }));
        }
      } catch (error) {
        console.log("[Weather] Open-Meteo error:", error.message);
      }
    }

    // If still no alerts, check for general severe weather conditions
    if (alerts.length === 0) {
      try {
        // Get current weather to check for severe conditions
        const weatherResponse = await axios.get(
          `${OPENMETEO_BASE_URL}/forecast`,
          {
            params: {
              latitude: parseFloat(lat),
              longitude: parseFloat(lon),
              current: "weather_code,wind_speed_10m,precipitation",
              timezone: "auto",
            },
            timeout: 5000,
          }
        );

        const current = weatherResponse.data?.current;
        if (current) {
          // Generate alerts based on severe conditions
          const generatedAlerts = [];

          // High wind warning (> 25 m/s or ~56 mph)
          if (current.wind_speed_10m > 25) {
            generatedAlerts.push({
              id: `wind-${Date.now()}`,
              title: "High Wind Warning",
              description: `Strong winds detected: ${current.wind_speed_10m.toFixed(1)} m/s. Take precautions.`,
              severity: "moderate",
              startTime: new Date().toISOString(),
              endTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
              source: "Weather Conditions",
              tags: ["wind", "severe"],
            });
          }

          // Heavy precipitation warning
          if (current.precipitation > 10) {
            generatedAlerts.push({
              id: `precip-${Date.now()}`,
              title: "Heavy Precipitation Warning",
              description: `Heavy precipitation detected: ${current.precipitation.toFixed(1)} mm. Stay safe.`,
              severity: "moderate",
              startTime: new Date().toISOString(),
              endTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
              source: "Weather Conditions",
              tags: ["precipitation", "rain"],
            });
          }

          // Severe weather code warnings (WMO codes)
          const severeCodes = [95, 96, 99]; // Thunderstorms with hail
          if (severeCodes.includes(current.weather_code)) {
            generatedAlerts.push({
              id: `severe-${Date.now()}`,
              title: "Severe Weather Alert",
              description: "Severe weather conditions detected. Take shelter and stay safe.",
              severity: "high",
              startTime: new Date().toISOString(),
              endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
              source: "Weather Conditions",
              tags: ["severe", "thunderstorm"],
            });
          }

          alerts = generatedAlerts;
        }
      } catch (error) {
        console.log("[Weather] Forecast fetch error:", error.message);
      }
    }

    res.json({
      success: true,
      alerts: alerts,
      count: alerts.length,
      location: {
        lat: parseFloat(lat),
        lon: parseFloat(lon),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Weather] Error fetching weather alerts:", error);
    res.status(500).json({
      error: "Failed to fetch weather alerts",
      message: error.message,
    });
  }
});

/**
 * Get current weather conditions
 */
router.get("/current", async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        error: "Latitude and longitude are required",
      });
    }

    // Use Open-Meteo (no API key needed)
    const response = await axios.get(`${OPENMETEO_BASE_URL}/forecast`, {
      params: {
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation",
        timezone: "auto",
      },
      timeout: 5000,
    });

    const current = response.data?.current;
    if (!current) {
      return res.status(404).json({ error: "Weather data not found" });
    }

    res.json({
      success: true,
      weather: {
        temperature: current.temperature_2m,
        humidity: current.relative_humidity_2m,
        weatherCode: current.weather_code,
        windSpeed: current.wind_speed_10m,
        precipitation: current.precipitation,
      },
      location: {
        lat: parseFloat(lat),
        lon: parseFloat(lon),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Weather] Error fetching current weather:", error);
    res.status(500).json({
      error: "Failed to fetch weather data",
      message: error.message,
    });
  }
});

module.exports = router;

