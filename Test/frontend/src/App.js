import React, { useState } from "react";

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [result, setResult] = useState("");
  const [textInput, setTextInput] = useState("");

  // 🎤 Start recording voice
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = async () => {
      try {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("file", blob, "recording.webm");

        const response = await fetch("http://127.0.0.1:8000/process_audio", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setResult(data.recommendation || "No result");
      } catch (error) {
        console.error("Error processing audio:", error);
        setResult(`Error: ${error.message}. Make sure the backend server is running on http://127.0.0.1:8000`);
      }
    };

    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
  };

  // 🛑 Stop recording
  const stopRecording = () => {
    mediaRecorder.stop();
    setIsRecording(false);
  };

  // ⌨️ Send text input
  const handleTextSubmit = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/process_text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textInput }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data.recommendation || "No result");
    } catch (error) {
      console.error("Error processing text:", error);
      setResult(`Error: ${error.message}. Make sure the backend server is running on http://127.0.0.1:8000`);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h1>🌪️ Disaster Safety Assistant</h1>
      <p>Use your voice or type to describe your situation.</p>

      {/* Voice Input */}
      <button onClick={isRecording ? stopRecording : startRecording}>
        {isRecording ? "Stop Recording" : "Start Voice Input"}
      </button>

      {/* Text Input */}
      <div style={{ marginTop: "1rem" }}>
        <input
          type="text"
          placeholder="Type your situation..."
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
        />
        <button onClick={handleTextSubmit}>Submit Text</button>
      </div>

      {result && (
        <p style={{ marginTop: "2rem" }}>
          🚨 Recommended Route: <strong>{result}</strong>
        </p>
      )}
    </div>
  );
}

export default App;
