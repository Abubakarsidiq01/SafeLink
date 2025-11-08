import React, { useState } from "react";

function App() {
  const [text, setText] = useState("");
  const [decision, setDecision] = useState("");
  const [recording, setRecording] = useState(false);

  // Change this if your FastAPI backend runs somewhere else
  const API_BASE = "http://127.0.0.1:8000";

  // 🎙 Voice Input
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];
      setRecording(true);

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("file", blob, "input.webm");

        const res = await fetch(`${API_BASE}/process_audio`, {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        setDecision(data.decision);
        setRecording(false);
      };

      mediaRecorder.start();

      // Auto stop after 5 seconds
      setTimeout(() => {
        mediaRecorder.stop();
        stream.getTracks().forEach((t) => t.stop());
      }, 5000);
    } catch (err) {
      console.error("Error recording audio:", err);
    }
  };

  // ✍️ Text Input
  const handleTextSubmit = async () => {
    try {
      const res = await fetch(`${API_BASE}/process_text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setDecision(data.decision);
    } catch (err) {
      console.error("Error analyzing text:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-8">
      <h1 className="text-2xl font-bold mb-6">🌪 Disaster Help Assistant</h1>

      {/* Voice Input */}
      <button
        onClick={startRecording}
        disabled={recording}
        className={`${
          recording ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
        } text-white px-6 py-3 rounded-2xl mb-4`}
      >
        {recording ? "Recording..." : "🎙 Speak Your Situation"}
      </button>

      {/* Text Input */}
      <textarea
        className="border rounded-2xl w-80 p-3 mb-3"
        rows="4"
        placeholder="Or type your situation here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        onClick={handleTextSubmit}
        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl"
      >
        Submit Text
      </button>

      {/* Result */}
      {decision && (
        <div className="mt-6 text-lg font-semibold">
          Recommended Route:{" "}
          <span
            className={`${
              decision === "Hospital" ? "text-red-600" : "text-green-600"
            }`}
          >
            {decision}
          </span>
        </div>
      )}
    </div>
  );
}

export default App;
