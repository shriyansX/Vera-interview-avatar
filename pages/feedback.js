import { useState } from 'react';

export default function FeedbackPage() {
  const [rating, setRating] = useState(0);
  const [useAgain, setUseAgain] = useState('');
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const submitFeedback = async (event) => {
    event.preventDefault();
    if (!rating || !useAgain || status === 'sending') return;

    setStatus('sending');
    setError('');
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, useAgain, comment: comment.trim(), sessionScore: null }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not send feedback.');
      setStatus('sent');
    } catch (err) {
      setError(err.message);
      setStatus('idle');
    }
  };

  return (
    <main className="app-shell min-h-screen flex items-center justify-center px-4 py-12">
      <section className="glass-panel w-full max-w-lg p-6 sm:p-8 animate-fade-up">
        <div className="text-center mb-7">
          <span className="eyebrow">Vera feedback</span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-cream mt-4">Help us improve Vera</h1>
          <p className="text-muted text-sm sm:text-base mt-3 leading-relaxed">Tried the AI mock interview? Your honest feedback will help shape the next version.</p>
        </div>

        {status === 'sent' ? (
          <div className="feedback-form rounded-2xl border border-pass/30 bg-pass/10 p-6 text-center">
            <p className="text-pass font-medium text-lg">Thank you for sharing your feedback!</p>
            <p className="text-muted text-sm mt-2">Your response has been recorded.</p>
            <a href="/" className="inline-block text-amber text-sm underline mt-5 hover:text-cream transition-smooth">Try Vera again</a>
          </div>
        ) : (
          <form onSubmit={submitFeedback} className="feedback-form rounded-2xl border border-ink-700 p-5 sm:p-6">
            <fieldset className="mb-6">
              <legend className="text-sm text-cream font-medium mb-3">How would you rate the experience?</legend>
              <div className="flex gap-1.5" role="radiogroup" aria-label="Rate Vera from one to five">
                {[1, 2, 3, 4, 5].map(value => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => setRating(value)}
                    className={`rating-star ${value <= rating ? 'is-selected' : ''}`}
                    aria-label={`${value} out of 5`}
                    aria-pressed={value === rating}
                  >★</button>
                ))}
              </div>
            </fieldset>

            <fieldset className="mb-6">
              <legend className="text-sm text-cream font-medium mb-3">Would you use Vera again before placements?</legend>
              <div className="grid grid-cols-3 gap-2">
                {['Yes', 'Maybe', 'No'].map(option => (
                  <button
                    type="button"
                    key={option}
                    onClick={() => setUseAgain(option.toLowerCase())}
                    className={`selection-card rounded-xl border px-3 py-2.5 text-sm font-medium transition-smooth ${useAgain === option.toLowerCase() ? 'border-amber bg-amber/10 text-cream' : 'border-ink-700 bg-ink-800/60 text-muted hover:border-amber/50'}`}
                    aria-pressed={useAgain === option.toLowerCase()}
                  >{option}</button>
                ))}
              </div>
            </fieldset>

            <label htmlFor="comment" className="block text-sm text-cream font-medium mb-2">What was useful, confusing, or missing? <span className="text-muted font-normal">(optional)</span></label>
            <textarea
              id="comment"
              value={comment}
              onChange={event => setComment(event.target.value.slice(0, 500))}
              rows={4}
              maxLength={500}
              placeholder="Your honest thoughts…"
              className="answer-input w-full rounded-xl border border-ink-700 bg-ink-800 px-3 py-2.5 text-sm text-cream placeholder-muted/50 focus:border-amber focus:outline-none transition-smooth resize-none"
            />
            {error && <p className="text-fail text-xs mt-2" role="alert">{error}</p>}
            <button
              type="submit"
              disabled={!rating || !useAgain || status === 'sending'}
              className={`button-primary mt-5 w-full rounded-xl py-3 text-sm font-semibold transition-smooth ${rating && useAgain ? 'bg-amber text-ink-900 hover:bg-amber-dark' : 'bg-ink-700 text-muted cursor-not-allowed'}`}
            >{status === 'sending' ? 'Submitting…' : 'Submit feedback'}</button>
            <p className="text-[11px] text-muted text-center mt-3">Please don’t include personal or sensitive information.</p>
          </form>
        )}
      </section>
    </main>
  );
}
