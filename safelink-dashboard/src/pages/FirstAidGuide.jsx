// src/pages/FirstAidGuide.jsx

import React, { useState, useEffect, useRef } from "react";
import { getFirstAidInstructions } from "../api/firstAidApi";
import ConversationalAIDialog from "../components/firstaid/ConversationalAIDialog";
import "./FirstAidGuide.css";

export default function FirstAidGuide() {
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConversationalDialog, setShowConversationalDialog] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState("en-US");
  const recognitionRef = useRef(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [languageOptions] = useState([
    { code: "en-US", name: "English" },
    { code: "es-ES", name: "Spanish" },
    { code: "fr-FR", name: "French" },
    { code: "de-DE", name: "German" },
    { code: "it-IT", name: "Italian" },
    { code: "pt-BR", name: "Portuguese" },
    { code: "zh-CN", name: "Chinese" },
    { code: "ja-JP", name: "Japanese" },
    { code: "ko-KR", name: "Korean" },
    { code: "ar-SA", name: "Arabic" },
    { code: "hi-IN", name: "Hindi" },
  ]);

  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLanguage;

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }

        setDescription((prev) => {
          let baseText = prev.replace(/\[Listening\.\.\.\]/g, "").trim();
          if (finalTranscript) {
            baseText += (baseText ? " " : "") + finalTranscript.trim();
          }
          if (interimTranscript) {
            baseText += (baseText ? " " : "") + interimTranscript + " [Listening...]";
          }
          return baseText;
        });
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === "no-speech") {
          setSpeechError("No speech detected. Please try again.");
        } else if (event.error === "audio-capture") {
          setSpeechError("No microphone found.");
        } else if (event.error === "not-allowed") {
          setSpeechError("Microphone permission denied.");
        } else {
          setSpeechError("Speech recognition error.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setDescription((prev) => prev.replace(/\[Listening\.\.\.\]/g, "").trim());
      };

      recognitionRef.current = recognition;
    } else {
      setIsSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [selectedLanguage]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setSpeechError("Speech recognition is not supported.");
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error("Error stopping recognition:", err);
      }
      setIsListening(false);
      setDescription((prev) => prev.replace(/\[Listening\.\.\.\]/g, "").trim());
    } else {
      setSpeechError(null);
      try {
        recognitionRef.current.lang = selectedLanguage;
        setDescription((prev) => prev.replace(/\[Listening\.\.\.\]/g, "").trim());
        recognitionRef.current.start();
      } catch (err) {
        console.error("Error starting recognition:", err);
        setIsListening(false);
        setSpeechError("Could not start speech recognition.");
      }
    }
  };

  const handleGetInstructions = async () => {
    const cleanDescription = description.replace(/\[Listening\.\.\.\]/g, "").trim();
    
    if (!cleanDescription) {
      setError("Please describe the situation or injury.");
      return;
    }

    setLoading(true);
    setError(null);
    setInstructions(null);

    try {
      const result = await getFirstAidInstructions(cleanDescription);
      setInstructions(result);
    } catch (err) {
      console.error("Error getting first aid instructions:", err);
      setError(err.response?.data?.message || "Failed to get first aid instructions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="firstAidGuide">
      <div className="firstAidGuide__content">
        <div className="firstAidGuide__inputSection">
          <div className="inputCard">
            <div className="inputCard__header">
              <label htmlFor="description" className="inputCard__label">
                Describe the Situation or Injury
              </label>
              {isSpeechSupported && (
                <div className="inputCard__voiceControls">
                  <select
                    className="languageSelect"
                    value={selectedLanguage}
                    onChange={(e) => {
                      setSelectedLanguage(e.target.value);
                      if (isListening && recognitionRef.current) {
                        recognitionRef.current.stop();
                        setIsListening(false);
                      }
                    }}
                    disabled={isListening}
                  >
                    {languageOptions.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className={`voiceButton ${isListening ? "voiceButton--active" : ""}`}
                    onClick={toggleListening}
                    disabled={loading}
                    title={isListening ? "Stop recording" : "Start voice input"}
                  >
                    {isListening ? (
                      <>
                        <span className="voiceButton__icon voiceButton__icon--stop">⏹️</span>
                        <span className="voiceButton__text">Stop</span>
                      </>
                    ) : (
                      <>
                        <span className="voiceButton__icon">🎤</span>
                        <span className="voiceButton__text">Voice</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
            <textarea
              id="description"
              className={`inputCard__textarea ${isListening ? "inputCard__textarea--listening" : ""}`}
              placeholder="E.g., Someone is unconscious and not breathing, or I have a deep cut on my arm that's bleeding..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              disabled={loading || isListening}
            />
            {isListening && (
              <div className="listeningIndicator">
                <span className="listeningIndicator__dot"></span>
                Listening in {languageOptions.find(l => l.code === selectedLanguage)?.name}... Speak clearly.
              </div>
            )}
            {speechError && (
              <div className="speechError">
                {speechError}
              </div>
            )}
            <div className="inputCard__hint">
              Describe the injury, medical condition, or emergency situation. You can speak or type in multiple languages.
            </div>
            <div style={{ display: "flex", gap: "12px", flexDirection: "column" }}>
              <button
                className="getInstructionsButton"
                onClick={handleGetInstructions}
                disabled={loading || !description.trim() || isListening}
              >
                {loading ? "Getting Instructions..." : "🩹 Get First Aid Instructions"}
              </button>
              {instructions && (
                <button
                  className="conversationalButton"
                  onClick={() => setShowConversationalDialog(true)}
                >
                  🗣️ Start Conversational Guide (Voice)
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="errorCard">
            <div className="errorCard__icon">⚠️</div>
            <div className="errorCard__message">{error}</div>
          </div>
        )}

        {instructions && (
          <div className="instructionsCard">
            <div className="instructionsCard__header">
              <h2 className="instructionsCard__title">
                {instructions.title || "First Aid Instructions"}
              </h2>
              {instructions.severity && (
                <span className={`severityBadge severityBadge--${instructions.severity.toLowerCase()}`}>
                  {instructions.severity}
                </span>
              )}
            </div>

            {instructions.overview && (
              <div className="instructionsCard__section">
                <h3 className="instructionsCard__sectionTitle">Overview</h3>
                <p className="instructionsCard__text">{instructions.overview}</p>
              </div>
            )}

            {instructions.steps && instructions.steps.length > 0 && (
              <div className="instructionsCard__section">
                <h3 className="instructionsCard__sectionTitle">Step-by-Step Instructions</h3>
                <div className="stepsList">
                  {instructions.steps.map((step, index) => (
                    <div key={index} className="stepItem">
                      <div className="stepItem__number">{index + 1}</div>
                      <div className="stepItem__content">
                        <h4 className="stepItem__title">{step.title}</h4>
                        <p className="stepItem__description">{step.description}</p>
                        {step.image && (
                          <div className="stepItem__image">
                            <img 
                              src={step.image} 
                              alt={step.title}
                              onError={(e) => {
                                // Fallback if image fails to load
                                console.error("Image failed to load:", step.image);
                                e.target.style.display = "none";
                              }}
                            />
                          </div>
                        )}
                        {step.video && (
                          <div className="stepItem__video">
                            <iframe
                              src={step.video}
                              title={step.title}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            ></iframe>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {instructions.importantNotes && instructions.importantNotes.length > 0 && (
              <div className="instructionsCard__section">
                <h3 className="instructionsCard__sectionTitle">⚠️ Important Notes</h3>
                <ul className="notesList">
                  {instructions.importantNotes.map((note, index) => (
                    <li key={index} className="noteItem">{note}</li>
                  ))}
                </ul>
              </div>
            )}

            {instructions.whenToSeekHelp && (
              <div className="instructionsCard__section instructionsCard__section--warning">
                <h3 className="instructionsCard__sectionTitle">🚨 When to Seek Professional Help</h3>
                <p className="instructionsCard__text">{instructions.whenToSeekHelp}</p>
              </div>
            )}

            {instructions.additionalResources && instructions.additionalResources.length > 0 && (
              <div className="instructionsCard__section">
                <h3 className="instructionsCard__sectionTitle">📚 Additional Resources</h3>
                <ul className="resourcesList">
                  {instructions.additionalResources.map((resource, index) => (
                    <li key={index} className="resourceItem">
                      <a href={resource.url} target="_blank" rel="noopener noreferrer">
                        {resource.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {!instructions && !loading && !error && (
          <div className="placeholderCard">
            <div className="placeholderCard__icon">🩹</div>
            <h3 className="placeholderCard__title">Ready to Help</h3>
            <p className="placeholderCard__text">
              Describe the injury or medical situation above to get AI-powered first aid instructions.
            </p>
            <div className="placeholderCard__examples">
              <h4>Example Situations:</h4>
              <ul>
                <li>"Someone is unconscious and not breathing"</li>
                <li>"Deep cut on arm, bleeding heavily"</li>
                <li>"Person having a seizure"</li>
                <li>"Burns on hand from hot water"</li>
                <li>"Choking on food"</li>
              </ul>
            </div>
          </div>
        )}

        {showConversationalDialog && instructions && (
          <ConversationalAIDialog
            instructions={instructions}
            description={description}
            selectedLanguage={selectedLanguage}
            onClose={() => setShowConversationalDialog(false)}
          />
        )}
      </div>
    </div>
  );
}

