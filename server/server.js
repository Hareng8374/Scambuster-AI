const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3003;

app.use(cors());
app.use(express.json());

app.post("/analyze", (req, res) => {
  const { message } = req.body;
  console.log("📨 Message received:", message);

  // Simulate scam score logic (replace with your own logic later)
  const score = 87;
  const red_flags = [
    "Asks for personal info",
    "Sense of urgency",
    "Unknown sender"
  ];

  res.json({ score, red_flags });
});

app.listen(PORT, () => {
  console.log(`🛠 ScamBuster backend running at http://localhost:${PORT}`);
});
