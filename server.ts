import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API routes
app.post("/api/generate-minutes", async (req, res) => {
  try {
    const { notes } = req.body;

    if (!notes) {
      return res.status(400).json({ error: "Notes are required" });
    }

    const prompt = `
      You are an expert meeting recorder. Convert the following raw meeting notes into structured minutes.
      
      Format rules:
      1. Use Markdown for structure.
      2. Use BOLD ONLY for section headings and labels. 
      3. Do NOT bold the names of attendees, the overview text, or discussion points.
      4. Ensure double newline gaps between major sections for readability.
      5. For Action Points, use checkboxes [ ] and group them under "Polygon" and "Client" categories.
      
      CRITICAL: Follow this exact template:

      **PROJECT NAME:** [Project Name or "N/A"]
      **TOPIC:** [Main Topic or "N/A"]
      **DATE:** [Date of meeting or today's date if not mentioned]
      **ATTENDEES:** [List of people or "N/A"]

      **OVERVIEW**
      [Summary text here - NOT BOLD]

      **KEY DISCUSSION**
      - [Point 1 - NOT BOLD]
      - [Point 2 - NOT BOLD]

      **END OF MEETING CONCLUSION**
      [Conclusion text here - NOT BOLD]

      **ACTION POINTS**

      **Polygon**
      [ ] [Action item for Polygon]

      **Client**
      [ ] [Action item for Client]

      Raw Notes:
      ${notes}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: notes ? [{ parts: [{ text: prompt }] }] : [],
    });

    res.json({ minutes: response.text });
  } catch (error: any) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate minutes" });
  }
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
