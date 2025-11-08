from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# ✅ Allow requests from your React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Allow all origins (okay for local dev)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Configure Gemini API ---
# Load API key from environment variable (never hardcode API keys in source code)
api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError(
        "GEMINI_API_KEY or GOOGLE_API_KEY environment variable is required. "
        "Please set it in your .env file or environment."
    )
genai.configure(api_key=api_key)

# Try to load a supported Gemini model
# Using models available to your API key
try:
    model = genai.GenerativeModel("models/gemini-2.5-flash")
    print("✅ Loaded model: models/gemini-2.5-flash")
except Exception as e:
    print(f"⚠️ Failed to load models/gemini-2.5-flash: {e}")
    # Try alternative model names
    try:
        model = genai.GenerativeModel("models/gemini-2.0-flash")
        print("✅ Loaded model: models/gemini-2.0-flash")
    except Exception as e2:
        print(f"⚠️ Failed to load models/gemini-2.0-flash: {e2}")
        # Fallback to latest flash
        try:
            model = genai.GenerativeModel("models/gemini-flash-latest")
            print("✅ Loaded model: models/gemini-flash-latest")
        except Exception as e3:
            print(f"❌ Failed to load any model: {e3}")
            raise

# Define a simple schema for text input
class TextInput(BaseModel):
    message: str


# Health check endpoint
@app.get("/")
async def root():
    return {"status": "ok", "message": "Backend is running"}


# List available models endpoint (for debugging)
@app.get("/list-models")
async def list_models():
    try:
        models = []
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                models.append({
                    "name": m.name,
                    "display_name": m.display_name,
                    "supported_methods": list(m.supported_generation_methods)
                })
        return {"available_models": models}
    except Exception as e:
        return {"error": str(e), "available_models": []}


# ✍️ Process text input (Frontend -> /process_text)
@app.post("/process_text")
async def process_text(data: TextInput):
    try:
        prompt = f"""
        The user is in a natural disaster and said: "{data.message}".
        Determine if they need a 'Hospital' or just a 'Safe-Place'.
        Respond strictly with JSON in this format:
        {{"recommendation": "Hospital"}} or {{"recommendation": "Safe-Place"}}.
        """

        response = model.generate_content(prompt)
        decision_text = response.text.strip()

        print("🔹 Gemini Response (Text):", decision_text)

        # Try to parse JSON if the response is JSON-formatted
        try:
            # Remove markdown code blocks if present
            cleaned_text = decision_text.replace("```json", "").replace("```", "").strip()
            parsed = json.loads(cleaned_text)
            recommendation = parsed.get("recommendation", decision_text)
        except json.JSONDecodeError:
            # If not JSON, use the text directly
            recommendation = decision_text

        return {"recommendation": recommendation}
    except Exception as e:
        print(f"❌ Error processing text: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing text: {str(e)}")


# 🎤 Process audio input (Frontend -> /process_audio)
@app.post("/process_audio")
async def process_audio(file: UploadFile = File(...)):
    try:
        audio_bytes = await file.read()

        if not audio_bytes:
            raise HTTPException(status_code=400, detail="No audio data received")

        response = model.generate_content([
            {"mime_type": "audio/webm", "data": audio_bytes},
            {
                "text": (
                    "Listen carefully to this audio from a disaster victim. "
                    "Return JSON {\"recommendation\": \"Hospital\"} "
                    "or {\"recommendation\": \"Safe-Place\"} "
                    "based on the urgency of their condition."
                )
            },
        ])

        decision_text = response.text.strip()
        print("🔹 Gemini Response (Audio):", decision_text)

        # Try to parse JSON if the response is JSON-formatted
        try:
            # Remove markdown code blocks if present
            cleaned_text = decision_text.replace("```json", "").replace("```", "").strip()
            parsed = json.loads(cleaned_text)
            recommendation = parsed.get("recommendation", decision_text)
        except json.JSONDecodeError:
            # If not JSON, use the text directly
            recommendation = decision_text

        return {"recommendation": recommendation}
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error processing audio: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing audio: {str(e)}")
