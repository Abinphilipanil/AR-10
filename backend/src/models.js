import axios from "axios";

export async function listGeminiModels() {
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) throw new Error("Missing GEMINI_API_KEY");

  const url = "https://generativelanguage.googleapis.com/v1beta/models";

  const resp = await axios.get(url, {
    headers: { "x-goog-api-key": API_KEY },
  });

  return resp.data; // contains models[]
}
