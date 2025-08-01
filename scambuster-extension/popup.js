const BACKEND_URL = "http://localhost:3003/analyze";

chrome.storage.local.get("selectedText", ({ selectedText }) => {
  if (!selectedText) return;

  console.log("📤 Sending to backend:", selectedText);

  fetch(BACKEND_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: selectedText })
  })
    .then(res => {
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      return res.json();
    })
    .then(data => {
      console.log("📥 Received from backend:", data);

      document.getElementById("loading").style.display = "none";
      document.getElementById("result").innerHTML = `
        <p><strong>Scam Score:</strong> ${data.score}%</p>
        <p><strong>Red Flags:</strong></p>
        <ul>${data.red_flags.map(flag => `<li>${flag}</li>`).join("")}</ul>
      `;
    })
    .catch(err => {
      console.error("❌ Error contacting backend:", err);
      document.getElementById("loading").textContent = "Error analyzing message.";
    });
});
