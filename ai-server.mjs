import express from "express";
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.get('/', (req, res) => {
  res.json({ status: 'Dev 3 AI Server online', port: PORT });
});

app.listen(PORT, () => {
  console.log(`Dev 3 AI Server running on http://localhost:${PORT}`);
});

const mockSubscriptions = [
  { id: 1, name: "Slack Pro", category: "Communication", cost: 120, billing: "monthly", seats: 50, activeUsers: 48 },
  { id: 2, name: "Microsoft Teams", category: "Communication", cost: 200, billing: "monthly", seats: 50, activeUsers: 12 },
  { id: 3, name: "Figma Professional", category: "Design", cost: 144, billing: "yearly", seats: 10, activeUsers: 10 },
  { id: 4, name: "Zoom Enterprise", category: "Video", cost: 300, billing: "monthly", seats: 100, activeUsers: 20 } // Zombie sub!
];

app.post('/api/ai/analyze-spending', async (req, res) => {
  // In the real app, req.body.subscriptions comes from Dev 2. 
  // For now, use the mockSubscriptions array.
  const subsData = JSON.stringify(req.body.subscriptions || mockSubscriptions);

  const prompt = `
    You are a financial optimization AI for a SaaS platform. 
    Analyze this JSON array of a company's software subscriptions: ${subsData}
    
    Identify:
    1. Duplicate tools in the same category (e.g., paying for Slack and Teams).
    2. "Zombie" subscriptions (seats allocated vs active users is very low).
    3. Monthly vs Yearly savings (suggesting switching monthly plans to yearly).
    
    Return ONLY a raw JSON array of objects with this exact structure, no markdown formatting:
    [
      { "type": "duplicate" | "zombie" | "upgrade", "tool": "Tool Name", "savingEstimate": 100, "recommendation": "Detailed reason here" }
    ]
    `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    // Strip markdown backticks if Gemini includes them
    const cleanJson = response.text.replace(/```json/g, '').replace(/```/g, '');
    res.json(JSON.parse(cleanJson));
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "Failed to analyze subscriptions" });
  }
});

app.post('/api/ai/draft-email', async (req, res) => {
  const { vendorName, action, context } = req.body;
  // Example body: { vendorName: "Zoom", action: "cancel", context: "Only using 20 out of 100 seats." }

  const prompt = `
    Draft a professional, polite, but firm email to ${vendorName} support. 
    The goal is to ${action} the subscription. 
    Context: ${context}.
    Keep it under 3 paragraphs. Include placeholders like [My Name] and [Account Number].
    `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    res.json({ emailDraft: response.text });
  } catch (error) {
    res.status(500).json({ error: "Failed to draft email" });
  }
});

app.get('/api/simulate-renewals', (req, res) => {
  // Generate some fake log events to return to the frontend
  const logs = [
    `[SYSTEM] Scanning 1,200 subscriptions for upcoming renewals...`,
    `[ALERT] Figma Professional renews in 7 days. Dispatching review email to admin@brightloop.com...`,
    `[SUCCESS] Email dispatched via SendGrid simulation.`,
    `[ALERT] Zoom Enterprise renews in 3 days. Warning: Usage is extremely low. Attempting auto-pause...`
  ];

  // Log them beautifully in your terminal for the demo
  logs.forEach(log => {
    if (log.includes('[ALERT]')) console.log(`\x1b[33m${log}\x1b[0m`); // Yellow
    else if (log.includes('[SUCCESS]')) console.log(`\x1b[32m${log}\x1b[0m`); // Green
    else console.log(`\x1b[36m${log}\x1b[0m`); // Cyan
  });

  res.json({ success: true, logs });
});
