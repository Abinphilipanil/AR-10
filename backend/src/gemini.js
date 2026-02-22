import axios from "axios";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function toGeminiContents(messages) {
  return (messages || []).map((m) => ({
    role: m.sender === "bot" ? "model" : "user",
    parts: [{ text: m.text }],
  }));
}

export async function geminiChat({ message, messages, systemHint }) {
 const API_KEY =
  process.env.GEMINI_API_KEY ||
  process.env.MY_API_KEY ||
  process.env.GOOGLE_API_KEY;

  if (!API_KEY) {
    throw new Error("GEMINI_API_KEY not set in .env");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

  const history = messages?.length
    ? toGeminiContents(messages)
    : [{ role: "user", parts: [{ text: message || "" }] }];

  const contents = systemHint
    ? [{ role: "user", parts: [{ text: systemHint }] }, ...history]
    : history;

  const payload = {
    contents,
    generationConfig: { temperature: 0.4 },
  };

  try {
    const resp = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": API_KEY,
      },
    });

    return (
      resp.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response from Gemini."
    );
  } catch (err) {
    console.error("FULL GEMINI ERROR:");
    console.error(err.response?.data || err);
    throw err;
  }
}
