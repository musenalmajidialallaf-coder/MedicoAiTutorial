import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  const GROQ_KEY = process.env.GROQ_API_KEY || "";
  if (!GROQ_KEY) {
    console.error("CRITICAL: GROQ_API_KEY environment variable is missing.");
  }
  const groq = new Groq({ apiKey: GROQ_KEY });

  const CHAT_MODEL = "llama-3.3-70b-versatile";
  const VISION_MODEL = "llama-3.2-90b-vision-preview";

  // API Routes
  app.post("/api/ask", async (req, res) => {
    try {
      const { prompt } = req.body;
      const response = await groq.chat.completions.create({
        model: CHAT_MODEL,
        messages: [{ role: 'user', content: prompt }],
      });
      res.json({ content: response.choices[0]?.message?.content });
    } catch (error: any) {
      console.error("Groq API Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/analyze", async (req, res) => {
    try {
      const { prompt, base64Data, mimeType } = req.body;
      const isImage = mimeType.startsWith('image/');
      
      const messages: any[] = [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
          ]
        }
      ];

      if (isImage) {
        messages[0].content.push({
          type: "image_url",
          image_url: { url: `data:${mimeType};base64,${base64Data}` }
        });
      } else {
        messages[0].content.push({
          type: "text",
          text: `[File Content (Base64 Encoded)]: ${base64Data.slice(0, 50000)}` 
        });
      }

      const response = await groq.chat.completions.create({
        model: isImage ? VISION_MODEL : CHAT_MODEL,
        messages,
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      res.json(JSON.parse(content || "{}"));
    } catch (error: any) {
      console.error("Groq Analysis Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/quiz", async (req, res) => {
    try {
      const { prompt } = req.body;
      const response = await groq.chat.completions.create({
        model: CHAT_MODEL,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      });
      const content = response.choices[0]?.message?.content;
      res.json(JSON.parse(content || "[]"));
    } catch (error: any) {
      console.error("Groq Quiz Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
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
