import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    feedback: { type: SchemaType.STRING, nullable: true, description: 'Feedback on the previous answer (2-3 sentences).' },
    score:    { type: SchemaType.NUMBER, nullable: true, description: 'Score for the previous answer, 1-5.' },
    question: { type: SchemaType.STRING, nullable: true, description: 'The next interview question, or null when done.' },
    done:     { type: SchemaType.BOOLEAN, description: 'True after the 5th answer has been scored.' },
    summary:  { type: SchemaType.STRING, nullable: true, description: 'End-of-interview coaching summary (only when done=true).' },
  },
  required: ['done'],
};

function buildSystemInstruction(track, difficulty) {
  const trackDescriptions = {
    sde: 'SDE / Full-Stack — DSA, problem-solving, light system design',
    core: 'Core Technical — branch fundamentals, project deep-dives, applied engineering',
    hr: 'HR / Behavioral — communication, ownership, teamwork, pressure handling',
  };

  const difficultyDescriptions = {
    fresher: 'entry-level / fresher — straightforward questions, supportive tone',
    intermediate: 'intermediate — moderate difficulty, expects some depth',
    tough: 'tough — challenging questions, expects strong reasoning and depth',
  };

  return `You are Vera, a calm and encouraging mock interviewer for engineering campus placements.

INTERVIEW PARAMETERS:
- Track: ${trackDescriptions[track] || track}
- Difficulty: ${difficultyDescriptions[difficulty] || difficulty}

RULES:
1. Ask exactly ONE question at a time. Wait for the candidate's answer before proceeding.
2. After receiving an answer, provide specific feedback (2-3 sentences) and a score from 1 to 5:
   - 1 = Did not address the question
   - 2 = Partially addressed but major gaps
   - 3 = Adequate but could improve
   - 4 = Good, solid understanding
   - 5 = Excellent, thorough and insightful
3. Then ask the next question.
4. Conduct exactly 5 questions total.
5. After scoring the 5th answer, set "done" to true and provide a "summary" — a short coaching paragraph (3-5 sentences) summarizing overall performance and one concrete improvement area. Do NOT ask another question when done.
6. On the very first call (empty history / no user answers yet), just ask question 1. Set feedback and score to null.
7. Be encouraging but honest. Reference specific parts of the candidate's answer in your feedback.
8. Keep questions realistic — the kind asked in actual Indian campus placement drives.`;
}

// Retry helper: waits and retries on 429 rate-limit errors
async function generateWithRetry(model, contents, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await model.generateContent({ contents });
    } catch (err) {
      const is429 = err?.status === 429 ||
        err?.message?.includes('429') ||
        err?.message?.includes('Too Many Requests') ||
        err?.message?.includes('quota');

      if (is429 && attempt < maxRetries) {
        // Parse retry delay from error message, default to 15s
        const delayMatch = err.message?.match(/retry in ([\d.]+)s/i);
        const waitSec = delayMatch ? Math.min(parseFloat(delayMatch[1]), 60) : 15;
        console.log(`Rate limited. Waiting ${waitSec}s before retry ${attempt + 1}/${maxRetries}...`);
        await new Promise(r => setTimeout(r, waitSec * 1000));
        continue;
      }
      throw err;
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY is not set. Add it to your environment variables (Vercel dashboard → Settings → Environment Variables).',
    });
  }

  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  const { track, difficulty, history } = req.body || {};
  if (!track || !difficulty) {
    return res.status(400).json({ error: 'Missing required fields: track, difficulty.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: buildSystemInstruction(track, difficulty),
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.7,
      },
    });

    // Build Gemini conversation history from our flat history array.
    // Gemini requires the conversation to always start with a user turn,
    // so we always prepend the initial "start" message.
    const startMessage = {
      role: 'user',
      parts: [{ text: 'Start the mock interview. Ask me the first question.' }],
    };

    const contents = [startMessage];
    if (history && Array.isArray(history)) {
      for (const turn of history) {
        contents.push({
          role: turn.role === 'model' ? 'model' : 'user',
          parts: [{ text: turn.text }],
        });
      }
    }

    const result = await generateWithRetry(model, contents);
    const text = result.response.text();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return res.status(500).json({ error: 'Failed to parse model response as JSON.', raw: text });
    }

    // Include the raw model text so the frontend can store the exact model
    // output in conversation history — keeps it consistent with JSON mode.
    parsed._rawModelText = text;

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('Gemini API error:', err);

    // Friendly message for rate limits
    const is429 = err?.status === 429 ||
      err?.message?.includes('429') ||
      err?.message?.includes('quota');

    if (is429) {
      return res.status(429).json({
        error: 'Vera is taking a short breather (API rate limit). Please wait about a minute and try again.',
        detail: err.message || String(err),
        retryable: true,
      });
    }

    return res.status(500).json({
      error: 'Something went wrong calling the AI. Please try again.',
      detail: err.message || String(err),
    });
  }
}
