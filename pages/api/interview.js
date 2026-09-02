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

// Keep fallbacks limited to currently supported model IDs. An unavailable
// model must not be reported as a rate-limit problem.
const FALLBACK_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
];

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

function isRateLimitOrUnavailable(err) {
  const msg = (err?.message || '').toLowerCase();
  return err?.status === 429 ||
    err?.status === 503 ||
    msg.includes('429') ||
    msg.includes('too many requests') ||
    msg.includes('quota') ||
    msg.includes('404') ||
    msg.includes('not found') ||
    msg.includes('no longer available') ||
    msg.includes('service unavailable') ||
    msg.includes('high demand');
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

  const { track, difficulty, history } = req.body || {};
  if (!track || !difficulty) {
    return res.status(400).json({ error: 'Missing required fields: track, difficulty.' });
  }

  // Build conversation contents (shared across model attempts)
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

  // Use env var model first, then fallbacks
  const envModel = process.env.GEMINI_MODEL;
  const modelsToTry = envModel
    ? [envModel, ...FALLBACK_MODELS.filter(m => m !== envModel)]
    : FALLBACK_MODELS;

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError = null;
  let sawRateLimit = false;
  let sawTemporaryUnavailable = false;

  for (const modelName of modelsToTry) {
    try {
      console.log(`Trying model: ${modelName}`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: buildSystemInstruction(track, difficulty),
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
          temperature: 0.7,
        },
      });

      const result = await model.generateContent({ contents });
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
      lastError = err;
      if (err?.status === 429 || err?.message?.includes('429') || err?.message?.toLowerCase().includes('quota')) {
        sawRateLimit = true;
      }
      if (err?.status === 503 || err?.message?.toLowerCase().includes('service unavailable') || err?.message?.toLowerCase().includes('high demand')) {
        sawTemporaryUnavailable = true;
      }
      console.log(`Model ${modelName} failed: ${err.message}`);

      // If it's a rate limit or model not available, try the next model
      if (isRateLimitOrUnavailable(err)) {
        continue;
      }
      // For other errors, don't try fallbacks
      break;
    }
  }

  // All models failed
  console.error('All models failed. Last error:', lastError);

  const isRateLimited = sawRateLimit || lastError?.status === 429 ||
    lastError?.message?.includes('429') ||
    lastError?.message?.toLowerCase().includes('quota');
  const isUnavailable = lastError?.message?.includes('404') ||
    lastError?.message?.toLowerCase().includes('not found');
  if (isRateLimited) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({
      error: 'The Gemini API quota has been reached. Please wait a minute and try again.',
      retryable: true,
    });
  }

  if (sawTemporaryUnavailable) {
    res.setHeader('Retry-After', '20');
    return res.status(503).json({
      error: 'Vera is experiencing unusually high demand. Retrying shortly…',
      retryable: true,
    });
  }

  if (isUnavailable) {
    return res.status(503).json({
      error: 'The configured Gemini model is unavailable. Set GEMINI_MODEL to a supported model in Vercel.',
      detail: `Tried: ${modelsToTry.join(', ')}. Gemini: ${lastError?.message || 'model not found'}`,
    });
  }

  return res.status(500).json({
    error: 'Something went wrong calling the AI. Please try again.',
    detail: lastError?.message || String(lastError),
  });
}
