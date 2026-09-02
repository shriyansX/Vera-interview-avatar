export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { rating, useAgain, comment = '', sessionScore = null } = req.body || {};
  const validRating = Number.isInteger(rating) && rating >= 1 && rating <= 5;
  const validIntent = ['yes', 'maybe', 'no'].includes(useAgain);

  if (!validRating || !validIntent || typeof comment !== 'string' || comment.length > 500) {
    return res.status(400).json({ error: 'Please provide a valid rating and response.' });
  }

  // Deliberately collect no personal data. Submissions are available in
  // Vercel Function Logs for lightweight MVP validation.
  console.log(JSON.stringify({
    type: 'vera_feedback',
    rating,
    useAgain,
    comment: comment.trim(),
    sessionScore: typeof sessionScore === 'number' ? sessionScore : null,
    submittedAt: new Date().toISOString(),
  }));

  return res.status(200).json({ ok: true });
}
