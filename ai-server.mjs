import express from "express";
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

app.get('/', (req, res) => {
  res.json({ status: 'Dev 3 AI Server online', port: PORT, configured: Boolean(ai) });
});

app.post('/api/ai/analyze-spending', async (req, res) => {
  if (!ai) return res.status(503).json({ error: 'GEMINI_API_KEY is not configured' });
  const subscriptions = Array.isArray(req.body.subscriptions) ? req.body.subscriptions : [];
  const subsData = JSON.stringify(subscriptions);

  const prompt = `
    You are a financial optimization AI for a SaaS platform. 
    Analyze this JSON array of a company's software subscriptions: ${subsData}
    
    Identify:
    1. Duplicate tools in the same category (e.g., paying for Slack and Teams).
    2. "Zombie" subscriptions (seats allocated vs active users is very low).
    3. Monthly vs Yearly savings (suggesting switching monthly plans to yearly).
    
    Return ONLY a raw JSON array of objects with this exact structure, no markdown formatting:
    [
      { "type": "duplicate", "tool": "Tool Name", "savingEstimate": 100, "recommendation": "Detailed reason here", "confidence": 0.8 }
    ]
    The type must be exactly one of: duplicate, zombie, upgrade.
    savingEstimate must be an estimated annual savings amount in dollars. Do not invent usage or prices absent from the input.
    `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    // Strip markdown backticks if Gemini includes them
    const cleanJson = (response.text || '').replace(/```json/g, '').replace(/```/g, '').trim();
    res.json(JSON.parse(cleanJson));
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "Failed to analyze subscriptions" });
  }
});

app.post('/api/ai/draft-email', async (req, res) => {
  if (!ai) return res.status(503).json({ error: 'GEMINI_API_KEY is not configured' });
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

    res.json({ emailDraft: response.text || '' });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "Failed to draft email" });
  }
});

app.post('/api/ai/chat', async (req, res) => {
  if (!ai) return res.status(503).json({ error: 'GEMINI_API_KEY is not configured' });
  const { message, portfolio } = req.body;
  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'A non-empty message is required' });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are Brightloop's finance assistant. Answer clearly using the supplied billing portfolio, including metrics, subscriptions, and invoices. Do not invent totals or claim actions were taken. If the data does not contain an answer, say so.\n\nBilling portfolio:\n${JSON.stringify(portfolio || {})}\n\nUser question:\n${message}`,
    });
    res.json({ reply: response.text || 'Gemini returned an empty response.' });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "Failed to answer question" });
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

app.listen(PORT, () => {
  console.log(`Dev 3 AI Server running on http://localhost:${PORT}`);
});
