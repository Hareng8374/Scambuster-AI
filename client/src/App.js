import React, { useState } from "react";

// Import Tesseract.js from CDN
const loadTesseract = () => {
  return new Promise((resolve, reject) => {
    if (window.Tesseract) {
      resolve(window.Tesseract);
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/4.1.1/tesseract.min.js';
    script.onload = () => resolve(window.Tesseract);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// Mock circular progress bar component since we don't have the library
const CircularProgressbar = ({ value, text, styles }) => {
  const radius = 50;
  const strokeWidth = 6;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90 mx-auto"
        viewBox={`0 0 ${radius * 2} ${radius * 2}`}
      >
        <circle
          stroke="rgba(255,255,255,0.1)"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={styles.pathColor}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="transition-all duration-2000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white font-bold text-xl">{text}</span>
      </div>
    </div>
  );
};

function App() {
  const [message, setMessage] = useState("");
  const [result, setResult] = useState("");
  const [image, setImage] = useState(null);
  const [redFlags, setRedFlags] = useState([]);
  const [baseScamScore, setBaseScamScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [combinedScore, setCombinedScore] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const redFlagKeywords = [
    { phrase: "verify", label: "Verification scam" },
    { phrase: "click below", label: "Call-to-action" },
    { phrase: "click here", label: "Call-to-action" },
    { phrase: "bit.ly", label: "Shortened link" },
    { phrase: "urgent", label: "Urgency phrase" },
    { phrase: "tax refund", label: "Authority impersonation (IRS/tax refund)" },
    { phrase: "prize", label: "Too good to be true" },
    { phrase: "free", label: "Too good to be true" },
    { phrase: "congratulations", label: "Generic bait" },
    { phrase: "suspended", label: "Account threat" },
    { phrase: "expires", label: "Time pressure" },
    { phrase: "act now", label: "Urgency phrase" },
    { phrase: "limited time", label: "Time pressure" },
    { phrase: "confirm", label: "Verification scam" },
    { phrase: "update", label: "Account maintenance scam" },
    { phrase: "office 365", label: "Brand impersonation (Microsoft)" },
    { phrase: "microsoft", label: "Brand impersonation (Microsoft)" },
    { phrase: "email-records.com", label: "Suspicious sender domain" },

  ];

  const checkRedFlags = (text) => {
    const flags = new Set();
    const lower = text.toLowerCase();
    redFlagKeywords.forEach(({ phrase, label }) => {
      if (lower.includes(phrase)) {
        flags.add(`${label} (${phrase})`);
      }
    });
    if (text === text.toUpperCase() && text.length > 10) {
      flags.add("All caps - aggressive tone");
    }
    return Array.from(flags);
  };

  const simulateAIAnalysis = (messageText, detectedFlags) => {
    // Simulate AI scoring based on message content
    let aiScoreValue = 0;
    const suspiciousPatterns = [
      /\b(urgent|immediate|expire|suspend|verify|confirm|update|click|act now)\b/gi,
      /\b(free|prize|winner|congratulations|selected)\b/gi,
      /\b(tax refund|irs|government|bank|paypal|amazon)\b/gi,
      /https?:\/\/[^\s]+/gi, // URLs
      /\$\d+/gi, // Money amounts
    ];

    suspiciousPatterns.forEach(pattern => {
      const matches = messageText.match(pattern);
      if (matches) {
        aiScoreValue += matches.length * 15;
      }
    });

    // Add points for red flags
    aiScoreValue += detectedFlags.length * 10;

    // Cap at 100
    aiScoreValue = Math.min(aiScoreValue, 100);

    return aiScoreValue;
  };

  const generateAIResponse = (messageText, detectedFlags, aiScoreValue) => {
    let response = "AI SCAM ANALYSIS REPORT\n\n";
    
    if (aiScoreValue >= 70) {
      response += "🚨 HIGH RISK ASSESSMENT\n";
      response += "This message shows multiple indicators of a scam attempt.\n\n";
    } else if (aiScoreValue >= 40) {
      response += "⚠️ MODERATE RISK ASSESSMENT\n";
      response += "This message contains some suspicious elements.\n\n";
    } else {
      response += "✅ LOW RISK ASSESSMENT\n";
      response += "This message appears relatively safe.\n\n";
    }

    response += "DETECTED ISSUES:\n";
    if (detectedFlags.length > 0) {
      detectedFlags.forEach(flag => {
        response += `• ${flag}\n`;
      });
    } else {
      response += "• No major red flags detected\n";
    }

    response += "\nRECOMMENDATIONS:\n";
    if (aiScoreValue >= 70) {
      response += "• DO NOT click any links or provide personal information\n";
      response += "• DO NOT respond to this message\n";
      response += "• Block the sender immediately\n";
      response += "• Report this as spam/scam to your provider\n";
    } else if (aiScoreValue >= 40) {
      response += "• Verify sender identity through official channels\n";
      response += "• Be cautious with any requested actions\n";
      response += "• Do not provide sensitive information\n";
    } else {
      response += "• Message appears legitimate but stay vigilant\n";
      response += "• When in doubt, verify through official channels\n";
    }

    return response;
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setIsAnalyzing(true);
    
    try {
      // Load Tesseract.js
      const Tesseract = await loadTesseract();
      
      // Process the image with Tesseract OCR
      const { data: { text } } = await Tesseract.recognize(file, 'eng', {
        logger: m => console.log(m) // Optional: log progress
      });
      
      // Clean up the extracted text
      const cleanedText = text.trim().replace(/\s+/g, ' ');
      console.log("🧠 OCR Extracted Text:", cleanedText);

      
      if (cleanedText && cleanedText.length > 5) {
        setMessage(cleanedText);
      } else {
        setMessage("Could not extract clear text from image. Please type the message manually in the text area below.");
      }
      
    } catch (error) {
      console.error('OCR Error:', error);
      setMessage("OCR processing failed. Please type the suspicious message manually in the text area below.");
    }
    
    setIsAnalyzing(false);
  };

  const analyzeMessage = async () => {
  if (!message.trim()) return;
  setIsAnalyzing(true);

  try {
    const detectedFlags = checkRedFlags(message);
    const ruleScore = Math.min(detectedFlags.length * 20, 100);
    setBaseScamScore(ruleScore);

    const prompt = `
You are a cybersecurity AI trained to detect scam messages across all formats including emails, SMS, and DMs.

Your task:
1. Analyze the message below and identify manipulative, fraudulent, or suspicious content.
2. Return the response in the following format:
Scam Score: [0-100]
Explanation: [your reasoning]
Advice: [guidance for the user]

Message: "${message}"
    `;

    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt }),
    });

    const data = await response.json();
    const reply = data.message?.content || "";

    let scamScore = 0;
    let explanation = "";

    const lines = reply.split("\n");
    const scoreLine = lines.find((line) => line.toLowerCase().includes("scam score"));
    scamScore = parseInt(scoreLine?.match(/\d+/)?.[0] || "0");
    explanation = lines.slice(1).join("\n");

    setAiScore(scamScore);
    setCombinedScore(Math.round((ruleScore + scamScore) / 2));
    setRedFlags(detectedFlags);
    setResult(explanation || "No explanation provided.");
  } catch (error) {
    console.error("AI Error:", error.message);
    setResult("Error contacting AI service.");
  }

  setIsAnalyzing(false);
};


  const getScoreColor = (score) => {
    if (score < 30) return "text-emerald-400";
    if (score < 70) return "text-amber-400";
    return "text-rose-400";
  };

  const getScoreBgGradient = (score) => {
    if (score < 30) return "from-emerald-500/20 via-teal-500/10 to-green-500/20";
    if (score < 70) return "from-amber-500/20 via-yellow-500/10 to-orange-500/20";
    return "from-rose-500/20 via-red-500/10 to-pink-500/20";
  };

  const getProgressColor = (score) => {
    if (score < 30) return "#10b981";
    if (score < 70) return "#f59e0b";
    return "#ef4444";
  };

  const getRiskLabel = (score) => {
    if (score < 30) return "LOW RISK";
    if (score < 70) return "MEDIUM RISK";
    return "HIGH RISK";
  };

  const getRiskDescription = (score) => {
    if (score < 30) return "Message appears legitimate";
    if (score < 70) return "Exercise caution";
    return "High probability of scam";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-pulse"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-pulse"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-pulse"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12 max-w-7xl">
        {/* Elegant Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-8">
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-400 via-cyan-500 to-indigo-500 rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
              <div className="relative bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/20 shadow-2xl">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <h1 className="text-7xl font-black mb-6">
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              ScamBuster
            </span>
            <span className="text-white"> AI</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-light">
            Next-generation AI protection against fraudulent messages and sophisticated scam attempts
          </p>
          <div className="flex items-center justify-center mt-6 space-x-8 text-sm text-slate-400">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              AI Powered
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
              Real-time Analysis
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-indigo-400 rounded-full mr-2 animate-pulse"></div>
              Advanced Detection
            </div>
          </div>
        </div>

        <div className="grid xl:grid-cols-2 gap-12">
          {/* Input Section */}
          <div className="space-y-8">
            {/* Upload Card */}
            <div className="group">
              <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl hover:bg-white/10 transition-all duration-500 hover:scale-[1.02] hover:shadow-purple-500/25">
                <div className="flex items-center mb-6">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-3 rounded-2xl mr-4 shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">Screenshot Analysis</h3>
                </div>
                <div className="relative">
                  <input
                    type="file"
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={isAnalyzing}
                  />
                  <div className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-500 ${
                    isAnalyzing 
                      ? 'border-blue-400/50 bg-blue-500/10' 
                      : 'border-white/20 hover:border-blue-400/50 hover:bg-white/5'
                  }`}>
                    {isAnalyzing ? (
                      <div className="flex flex-col items-center">
                        <div className="relative mb-4">
                          <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-400/30 border-t-cyan-400"></div>
                          <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-4 border-cyan-400/20"></div>
                        </div>
                        <span className="text-cyan-400 font-semibold text-lg">Processing image...</span>
                        <span className="text-slate-400 text-sm mt-1">Using Tesseract OCR engine</span>
                      </div>
                    ) : (
                      <>
                        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-4 rounded-2xl w-fit mx-auto mb-6">
                          <svg className="h-12 w-12 text-white" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <p className="text-white font-semibold text-lg mb-2">Drop your screenshot here</p>
                        <p className="text-slate-400">or click to browse • PNG, JPG, GIF up to 10MB</p>
                        <p className="text-slate-500 text-xs mt-2">Real OCR powered by Tesseract.js</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Message Input Card */}
            <div className="group">
              <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl hover:bg-white/10 transition-all duration-500 hover:scale-[1.02] hover:shadow-purple-500/25">
                <div className="flex items-center mb-6">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-2xl mr-4 shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">Message Analysis</h3>
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Paste the suspicious message here for comprehensive AI analysis..."
                  rows="10"
                  className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl resize-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 text-white placeholder-slate-400 backdrop-blur-sm"
                  disabled={isAnalyzing}
                />
                
                <button
                  onClick={analyzeMessage}
                  disabled={!message.trim() || isAnalyzing}
                  className={`mt-6 w-full py-4 px-8 rounded-2xl font-bold text-white transition-all duration-500 transform ${
                    !message.trim() || isAnalyzing
                      ? 'bg-slate-600/50 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 hover:scale-105 shadow-2xl hover:shadow-purple-500/50'
                  } relative overflow-hidden group`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  {isAnalyzing ? (
                    <div className="flex items-center justify-center relative z-10">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white mr-3"></div>
                      Analyzing with AI...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center relative z-10">
                      <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Analyze Message
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-8">
            {/* Scam Score Card */}
            {combinedScore > 0 && (
              <div className={`bg-gradient-to-br ${getScoreBgGradient(combinedScore)} backdrop-blur-2xl rounded-3xl border border-white/20 p-8 shadow-2xl hover:scale-[1.02] transition-all duration-500`}>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-6">Risk Assessment</h3>
                  <div className="flex justify-center mb-6 mt-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full blur-lg opacity-30 animate-pulse"></div>
                      <div className="relative">
                        <CircularProgressbar
                          value={combinedScore}
                          text={`${combinedScore}%`}
                          styles={{
                            pathColor: getProgressColor(combinedScore)
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className={`text-4xl font-black ${getScoreColor(combinedScore)} mb-3 tracking-wide`}>
                    {getRiskLabel(combinedScore)}
                  </div>
                  <div className="text-slate-300 text-sm">
                    {getRiskDescription(combinedScore)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/10">
                    <div className="text-3xl font-black text-white mb-1">{aiScore}%</div>
                    <div className="text-sm text-slate-300 flex items-center justify-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      AI Analysis
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/10">
                    <div className="text-3xl font-black text-white mb-1">{baseScamScore}%</div>
                    <div className="text-sm text-slate-300 flex items-center justify-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0 0h2m-2 0v4m6-6V9a2 2 0 00-2-2H9m12 0a2 2 0 00-2-2H9m12 0V7a2 2 0 00-2-2H9m12 0V5" />
                      </svg>
                      Pattern Match
                    </div>
                  </div>
                </div>

                {/* Red Flags */}
                {redFlags.length > 0 && (
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-red-500/20">
                    <h4 className="font-bold text-white mb-4 flex items-center text-lg">
                      <div className="bg-red-500 p-2 rounded-xl mr-3">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      Red Flags ({redFlags.length})
                    </h4>
                    <div className="space-y-3">
                      {redFlags.map((flag, idx) => (
                        <div key={idx} className="flex items-center text-sm text-slate-200 bg-red-500/10 rounded-xl p-3 border border-red-500/20">
                          <div className="w-2 h-2 bg-red-400 rounded-full mr-3 flex-shrink-0 animate-pulse"></div>
                          {flag}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI Analysis Results */}
            {result && (
              <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl hover:scale-[1.02] transition-all duration-500">
                <div className="flex items-center mb-6">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-3 rounded-2xl mr-4 shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">AI Analysis & Recommendations</h3>
                </div>
                <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <pre className="text-sm text-slate-200 whitespace-pre-wrap font-mono leading-relaxed">
                    {result}
                  </pre>
                </div>
              </div>
            )}

            {/* Welcome Card */}
            {!result && !combinedScore && (
              <div className="bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-2xl rounded-3xl border border-white/20 p-10 shadow-2xl">
                <div className="text-center">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                    <div className="relative bg-gradient-to-r from-cyan-500 to-purple-500 p-6 rounded-3xl w-24 h-24 mx-auto flex items-center justify-center">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Advanced Protection Ready</h3>
                  <p className="text-slate-300 leading-relaxed text-lg max-w-md mx-auto">
                    Upload a screenshot or paste a suspicious message to activate our AI-powered scam detection system.
                  </p>
                  <div className="grid grid-cols-3 gap-4 mt-8 text-sm">
                    <div className="text-center">
                      <div className="bg-white/10 rounded-xl p-3 mb-2">
                        <svg className="w-6 h-6 text-cyan-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <span className="text-slate-300">Instant</span>
                    </div>
                    <div className="text-center">
                      <div className="bg-white/10 rounded-xl p-3 mb-2">
                        <svg className="w-6 h-6 text-purple-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-slate-300">Accurate</span>
                    </div>
                    <div className="text-center">
                      <div className="bg-white/10 rounded-xl p-3 mb-2">
                        <svg className="w-6 h-6 text-pink-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <span className="text-slate-300">Secure</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Demo Message Button */}
        {!result && !combinedScore && (
          <div className="text-center mt-12">
            <button
              onClick={() => {
                setMessage("Your IRS tax refund is pending acceptance. Must accept within 24 hours: http://bit.ly/sdfsdf.");
                setTimeout(() => {
                  analyzeMessage();
                }, 100);
              }}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold py-3 px-8 rounded-2xl shadow-lg hover:scale-105 transition-all duration-300"
            >
              Try Demo Message
            </button>
            <p className="text-slate-400 text-sm mt-2">Click to test with the IRS scam example</p>
            
            <div className="mt-4">
              <p className="text-slate-400 text-xs text-center">
                💡 Tip: For best results, type suspicious messages manually in the text area above
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

