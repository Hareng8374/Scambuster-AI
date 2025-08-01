const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { Configuration, OpenAIApi } = require("openai");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// OpenAI Setup
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Scam detection route
app.post("/api/analyze", async (req, res) => {
  const { message } = req.body;

  if (!message) return res.status(400).json({ error: "Message is required." });

  const prompt = `
You are an AI scam detector. Analyze the following message for signs of a scam. Return a scam score (0-100), red flags, and a short explanation. Only return JSON format like:
{
  "score": 85,
  "redFlags": ["Too good to be true", "Unprofessional language"],
  "explanation": "The message promises unrealistic earnings and uses vague, scam-like language."
}

Message: """${message}"""
`;

  try {
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const result = response.data.choices[0].message.content;
    const parsed = JSON.parse(result);
    res.json(parsed);
  } catch (err) {
    console.error("OpenAI error:", err.message);
    res.status(500).json({ error: "Failed to analyze message." });
  }
});

// 👉 Serve React frontend in production
app.use(express.static(path.join(__dirname, "../client/build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build", "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ ScamBuster server running on port ${PORT}`);
});
