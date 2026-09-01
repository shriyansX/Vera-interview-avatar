# Vera — AI Mock Interview for Campus Placements

Vera is a spoken AI mock interviewer that recreates the pressure of a real campus placement interview. Instead of silently reading question banks, you answer out loud (or type) and get instant scored feedback — just like the real thing.

## Why an avatar?

Reading questions off a screen doesn't build the muscle memory you need for a live interview. Vera speaks the question aloud, listens to your answer, and gives you a score with specific feedback. The avatar creates a sense of presence — idle, speaking, listening, thinking — so it feels like you're sitting across from someone, not filling out a form.

## Features

- **Three tracks**: SDE / Full-Stack, Core Technical, HR / Behavioral
- **Three difficulty levels**: Fresher, Intermediate, Tough
- **5-question sessions** with per-question scoring (1–5) and specific feedback
- **Voice input** via browser SpeechRecognition (Chromium) with typed-text fallback
- **Voice output** via browser SpeechSynthesis — Vera reads each question aloud
- **End-of-session summary** with average score and a coaching note
- **Fully responsive** — works on phones (375px+)
- **Stateless** — no database, no sign-up, no cookies

## Local setup

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/vera.git
cd vera

# 2. Install dependencies
npm install

# 3. Create your env file
cp .env.example .env.local

# 4. Add your Gemini API key to .env.local
#    Get one free at https://aistudio.google.com/apikey
#    GEMINI_API_KEY=your_key_here

# 5. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel (step by step)

1. **Push to GitHub** — create a new repo and push this code.
2. **Import to Vercel** — go to [vercel.com/new](https://vercel.com/new), import the GitHub repo. Vercel auto-detects Next.js.
3. **Set environment variable** — in the Vercel dashboard, go to *Settings → Environment Variables* and add:
   - `GEMINI_API_KEY` = your Google Gemini API key
   - (Optional) `GEMINI_MODEL` = override the default model (`gemini-2.5-flash`)
4. **Deploy** — click Deploy. That's it.
5. **Enable Vercel Analytics** — in the Vercel dashboard, go to *Analytics* tab and enable it. The `@vercel/analytics` package is already wired into the app.

## Tech stack

- Next.js 14 (pages router)
- React 18
- Tailwind CSS
- Gemini API (server-side only via `@google/generative-ai`)
- Browser SpeechSynthesis + SpeechRecognition
- `@vercel/analytics`

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | Yes | — | Your Google Gemini API key |
| `GEMINI_MODEL` | No | `gemini-2.5-flash` | Override the Gemini model name |

## License

MIT
