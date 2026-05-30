import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Route for Anthropic coach proxy
  app.post('/api/coach', async (req, res) => {
    try {
      const { messages, commitment } = req.body;
      const anthropicKey = process.env.ANTHROPIC_API_KEY;
      const geminiKey = process.env.GEMINI_API_KEY;

      if (!anthropicKey && !geminiKey) {
        return res.status(500).json({
          error: "No API keys configured on server. Please set GEMINI_API_KEY or ANTHROPIC_API_KEY in the environment."
        });
      }

      // If ANTHROPIC_API_KEY is configured, use Claude
      if (anthropicKey) {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1000,
            system: "You are FORGE_AI, elite AI Productivity Coach inside MonkMode. Concise, direct, intelligent. Reference flow state, ultradian rhythms, dopamine management, Cal Newport deep work, habit loops. Max 100 words. Commitment level: " + commitment,
            messages: messages
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Anthropic API responded with status ${response.status}: ${errText}`);
        }

        const data = await response.json();
        return res.json(data);
      } else {
        // Fallback to Gemini if only GEMINI_API_KEY is available
        const contents = messages.map((m: any) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content || "" }]
        }));

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: contents,
            systemInstruction: {
              parts: [{ text: "You are FORGE_AI, elite AI Productivity Coach inside MonkMode. Concise, direct, intelligent. Reference flow state, ultradian rhythms, dopamine management, Cal Newport deep work, habit loops. Max 100 words. Commitment level: " + commitment }]
            },
            generationConfig: {
              maxOutputTokens: 1000
            }
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Gemini API responded with status ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Coach unavailable. Keep focus!";
        
        // Emulate Claude message format so frontend is identical
        return res.json({
          content: [{ type: 'text', text: reply }]
        });
      }
    } catch (error: any) {
      console.error("Coach API error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  const port = 3000;
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

startServer();
