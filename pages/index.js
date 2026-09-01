import { useState, useEffect, useRef, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════
   AVATAR COMPONENT — SVG + CSS animated presence
   States: idle | speaking | listening | thinking
   ═══════════════════════════════════════════════════════════════════════════ */
function Avatar({ state = 'idle' }) {
  return (
    <div className="relative flex items-center justify-center w-28 h-28 sm:w-36 sm:h-36" aria-label={`Vera is ${state}`}>
      {/* Outer pulse ring — speaking */}
      {state === 'speaking' && (
        <>
          <span className="absolute inset-0 rounded-full border-2 border-amber" style={{ animation: 'avatar-speaking-ring 1.4s ease-out infinite' }} />
          <span className="absolute inset-0 rounded-full border-2 border-amber" style={{ animation: 'avatar-speaking-ring 1.4s ease-out 0.5s infinite' }} />
        </>
      )}

      {/* Outer listening ring — mic waveform */}
      {state === 'listening' && (
        <span className="absolute inset-0 rounded-full border-2 border-pass" style={{ animation: 'pulse-ring 1.6s ease-out infinite' }} />
      )}

      {/* Core circle */}
      <div
        className={`relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 transition-smooth ${
          state === 'idle' ? 'border-ink-700 bg-ink-800' :
          state === 'speaking' ? 'border-amber bg-ink-800' :
          state === 'listening' ? 'border-pass bg-ink-800' :
          'border-ink-700 bg-ink-800'
        }`}
        style={state === 'idle' ? { animation: 'avatar-idle 3s ease-in-out infinite' } : undefined}
      >
        {/* Face — SVG */}
        <svg viewBox="0 0 80 80" className="w-14 h-14 sm:w-16 sm:h-16" aria-hidden="true">
          {/* Eyes */}
          <circle cx="28" cy="32" r="3" className={`transition-smooth ${state === 'thinking' ? 'fill-muted' : 'fill-cream'}`}>
            {state === 'listening' && <animate attributeName="r" values="3;3.5;3" dur="1.5s" repeatCount="indefinite" />}
          </circle>
          <circle cx="52" cy="32" r="3" className={`transition-smooth ${state === 'thinking' ? 'fill-muted' : 'fill-cream'}`}>
            {state === 'listening' && <animate attributeName="r" values="3;3.5;3" dur="1.5s" begin="0.2s" repeatCount="indefinite" />}
          </circle>

          {/* Mouth / expression */}
          {state === 'speaking' ? (
            /* Speaking: animated open mouth */
            <ellipse cx="40" cy="52" rx="8" ry="4" className="fill-amber">
              <animate attributeName="ry" values="4;6;3;5;4" dur="0.6s" repeatCount="indefinite" />
            </ellipse>
          ) : state === 'thinking' ? (
            /* Thinking: small flat line */
            <line x1="32" y1="52" x2="48" y2="52" stroke="#9AA5B1" strokeWidth="2" strokeLinecap="round" />
          ) : (
            /* Idle/Listening: gentle smile */
            <path d="M30 48 Q40 58 50 48" fill="none" stroke={state === 'listening' ? '#4CAF7D' : '#F2EFE7'} strokeWidth="2" strokeLinecap="round" className="transition-smooth" />
          )}
        </svg>

        {/* Thinking dots overlay */}
        {state === 'thinking' && (
          <div className="absolute -bottom-1 flex gap-1.5">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-2 h-2 rounded-full bg-muted"
                style={{ animation: `avatar-thinking-dot 1.2s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Listening: waveform bars around bottom */}
      {state === 'listening' && (
        <div className="absolute -bottom-2 flex items-end gap-0.5">
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <span
              key={i}
              className="w-1 bg-pass rounded-full"
              style={{
                height: '14px',
                animation: `avatar-listening-bar 0.8s ease-in-out ${i * 0.1}s infinite`,
                transformOrigin: 'bottom',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════
   PROGRESS BAR
   ═══════════════════════════════════════════════════════════════════════════ */
function ProgressBar({ current, total }) {
  return (
    <div className="flex items-center gap-3" role="progressbar" aria-valuenow={current} aria-valuemin={1} aria-valuemax={total} aria-label={`Question ${current} of ${total}`}>
      <span className="text-sm text-muted font-sans">
        Question <span className="text-cream font-medium">{current}</span> of {total}
      </span>
      <div className="flex gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`w-2 h-2 rounded-full transition-smooth ${
              i < current ? 'bg-amber' : 'bg-ink-700'
            }`}
          />
        ))}
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════
   SCORE CHIP
   ═══════════════════════════════════════════════════════════════════════════ */
function ScoreChip({ score, index, label }) {
  const isStrong = score >= 4;
  const isWeak = score <= 2;
  return (
    <div
      className={`animate-score-chip inline-flex flex-col items-center gap-1 px-3 py-2 rounded-lg border ${
        isStrong ? 'border-pass bg-pass/10' :
        isWeak ? 'border-fail bg-fail/10' :
        'border-ink-700 bg-ink-800'
      }`}
      style={{ animationDelay: `${index * 0.1}s` }}
      aria-label={`${label}: ${score} out of 5${isStrong ? ', strong' : isWeak ? ', needs improvement' : ''}`}
    >
      <span className="text-xs text-muted font-sans">{label}</span>
      <span className={`text-lg font-serif font-bold ${
        isStrong ? 'text-pass' : isWeak ? 'text-fail' : 'text-cream'
      }`}>
        {score}<span className="text-sm font-normal text-muted">/5</span>
      </span>
      {isStrong && <span className="text-[10px] text-pass font-medium uppercase tracking-wider">Strong</span>}
      {isWeak && <span className="text-[10px] text-fail font-medium uppercase tracking-wider">Review</span>}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════
   SETUP SCREEN
   ═══════════════════════════════════════════════════════════════════════════ */
function SetupScreen({ onStart }) {
  const [track, setTrack] = useState('');
  const [difficulty, setDifficulty] = useState('');

  const tracks = [
    { id: 'sde', label: 'SDE / Full-Stack', desc: 'DSA, problem-solving, light system design' },
    { id: 'core', label: 'Core Technical', desc: 'Branch fundamentals + project deep-dives' },
    { id: 'hr', label: 'HR / Behavioral', desc: 'Communication, ownership, pressure handling' },
  ];

  const difficulties = [
    { id: 'fresher', label: 'Fresher' },
    { id: 'intermediate', label: 'Intermediate' },
    { id: 'tough', label: 'Tough' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg animate-fade-up">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="mb-6">
            <Avatar state="idle" />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-cream mb-3 tracking-tight" style={{ fontFamily: 'Fraunces, Georgia, serif' }}>
            Vera
          </h1>
          <p className="text-muted text-base sm:text-lg max-w-md mx-auto leading-relaxed">
            A spoken mock interview that recreates the pressure of a real campus placement — not just reading questions silently.
          </p>
        </div>

        {/* Track picker */}
        <fieldset className="mb-8">
          <legend className="text-sm text-muted uppercase tracking-wider mb-3 font-sans font-medium">Interview Track</legend>
          <div className="grid gap-2">
            {tracks.map(t => (
              <button
                key={t.id}
                id={`track-${t.id}`}
                onClick={() => setTrack(t.id)}
                className={`text-left px-4 py-3 rounded-lg border transition-smooth font-sans ${
                  track === t.id
                    ? 'border-amber bg-amber/10 text-cream'
                    : 'border-ink-700 bg-ink-800 text-cream hover:border-ink-700 hover:bg-ink-800/80'
                }`}
                aria-pressed={track === t.id}
              >
                <span className="font-medium text-sm">{t.label}</span>
                <span className="block text-xs text-muted mt-0.5">{t.desc}</span>
              </button>
            ))}
          </div>
        </fieldset>

        {/* Difficulty picker */}
        <fieldset className="mb-8">
          <legend className="text-sm text-muted uppercase tracking-wider mb-3 font-sans font-medium">Difficulty</legend>
          <div className="flex gap-2">
            {difficulties.map(d => (
              <button
                key={d.id}
                id={`difficulty-${d.id}`}
                onClick={() => setDifficulty(d.id)}
                className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-smooth font-sans ${
                  difficulty === d.id
                    ? 'border-amber bg-amber/10 text-cream'
                    : 'border-ink-700 bg-ink-800 text-cream hover:border-ink-700'
                }`}
                aria-pressed={difficulty === d.id}
              >
                {d.label}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Start button */}
        <button
          id="start-interview"
          disabled={!track || !difficulty}
          onClick={() => onStart(track, difficulty)}
          className={`w-full py-3.5 rounded-lg font-sans font-semibold text-base transition-smooth ${
            track && difficulty
              ? 'bg-amber text-ink-900 hover:bg-amber-dark active:scale-[0.98]'
              : 'bg-ink-700 text-muted cursor-not-allowed'
          }`}
        >
          Start mock interview
        </button>
        <p className="text-xs text-muted text-center mt-3 font-sans">
          Uses your mic if allowed · typing always works too
        </p>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════
   INTERVIEW SCREEN
   ═══════════════════════════════════════════════════════════════════════════ */
function InterviewScreen({ track, difficulty, onComplete }) {
  const [history, setHistory] = useState([]);
  const [questionNum, setQuestionNum] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [feedbackScore, setFeedbackScore] = useState(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [avatarState, setAvatarState] = useState('thinking');
  const [isListening, setIsListening] = useState(false);
  const [scores, setScores] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);

  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);
  const speechSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Speak text aloud
  const speak = useCallback((text) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.95;
    utter.pitch = 1;
    setAvatarState('speaking');
    utter.onend = () => setAvatarState('idle');
    utter.onerror = () => setAvatarState('idle');
    window.speechSynthesis.speak(utter);
  }, []);

  // Call API
  const callAPI = useCallback(async (newHistory) => {
    setLoading(true);
    setError('');
    setAvatarState('thinking');

    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track, difficulty, history: newHistory }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'API request failed');

      // Process feedback from the previous answer
      if (data.feedback && data.score != null) {
        setFeedback(data.feedback);
        setFeedbackScore(data.score);
        setScores(prev => [...prev, data.score]);
        setShowFeedback(true);
      }

      if (data.done) {
        // Interview complete
        onComplete({
          scores: [...scores, data.score].filter(s => s != null),
          summary: data.summary,
          feedback: data.feedback,
          lastScore: data.score,
        });
        return;
      }

      if (data.question) {
        // Small delay so feedback is visible before the next question
        const delay = data.feedback ? 800 : 0;
        setTimeout(() => {
          setCurrentQuestion(data.question);
          setQuestionNum(prev => prev + 1);
          setShowFeedback(false);
          setAnswer('');
          setLoading(false);
          setAvatarState('idle');
          speak(data.question);
        }, delay);

        // Add model turn to history
        const modelTurn = JSON.stringify({
          feedback: data.feedback,
          score: data.score,
          question: data.question,
        });
        setHistory([...newHistory, { role: 'model', text: modelTurn }]);
      } else {
        setLoading(false);
        setAvatarState('idle');
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
      setAvatarState('idle');
    }
  }, [track, difficulty, scores, speak, onComplete]);

  // Initialize — ask first question
  useEffect(() => {
    callAPI([]);
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Speech recognition
  const toggleListening = useCallback(() => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      setAvatarState('idle');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    let finalTranscript = answer;

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interim = transcript;
        }
      }
      setAnswer(finalTranscript + interim);
    };

    recognition.onend = () => {
      setIsListening(false);
      setAvatarState('idle');
    };

    recognition.onerror = () => {
      setIsListening(false);
      setAvatarState('idle');
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setAvatarState('listening');
    // Cancel any speech
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }, [isListening, answer]);

  // Submit answer
  const submitAnswer = useCallback(() => {
    if (!answer.trim() || loading) return;
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel();

    const userTurn = { role: 'user', text: answer.trim() };
    const newHistory = [...history, userTurn];
    setHistory(newHistory);
    setAnswer('');
    callAPI(newHistory);
  }, [answer, loading, isListening, history, callAPI]);

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex justify-center mb-6">
          <ProgressBar current={questionNum} total={5} />
        </div>

        {/* Avatar */}
        <div className="flex justify-center mb-6">
          <Avatar state={avatarState} />
        </div>

        {/* Question card */}
        <div className="bg-ink-800 border border-ink-700 rounded-lg p-5 mb-4 min-h-[80px] transition-smooth">
          {loading && !currentQuestion ? (
            <p className="text-muted text-sm font-sans italic">Vera is preparing your first question…</p>
          ) : (
            <p className="text-cream font-sans text-base leading-relaxed animate-fade-up" key={currentQuestion}>
              {currentQuestion}
            </p>
          )}
        </div>

        {/* Feedback on previous answer */}
        {showFeedback && feedback && (
          <div className="bg-ink-800 border border-ink-700 rounded-lg p-4 mb-4 animate-fade-up">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-muted uppercase tracking-wider font-sans font-medium">Previous answer</span>
              <span className={`text-sm font-bold font-serif ${
                feedbackScore >= 4 ? 'text-pass' : feedbackScore <= 2 ? 'text-fail' : 'text-cream'
              }`} aria-label={`Score: ${feedbackScore} out of 5`}>
                {feedbackScore}/5
              </span>
            </div>
            <p className="text-muted text-sm font-sans leading-relaxed">{feedback}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="border border-fail/30 bg-fail/5 rounded-lg px-4 py-3 mb-4" role="alert">
            <p className="text-fail text-sm font-sans">{error}</p>
            <button
              onClick={() => callAPI(history)}
              className="text-xs text-fail underline mt-1 font-sans hover:text-cream transition-smooth"
            >
              Try again
            </button>
          </div>
        )}

        {/* Answer input */}
        {!loading && (
          <div className="animate-fade-up">
            <div className="relative">
              <textarea
                ref={textareaRef}
                id="answer-input"
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) submitAnswer(); }}
                placeholder="Type your answer here…"
                rows={4}
                className="w-full bg-ink-800 border border-ink-700 rounded-lg px-4 py-3 text-cream placeholder-muted/50 font-sans text-sm resize-none focus:border-amber focus:outline-none transition-smooth"
                aria-label="Your answer"
              />
              {/* Mic button */}
              {speechSupported && (
                <button
                  id="mic-toggle"
                  onClick={toggleListening}
                  className={`absolute right-3 bottom-3 w-8 h-8 rounded-full flex items-center justify-center transition-smooth ${
                    isListening
                      ? 'bg-pass text-ink-900'
                      : 'bg-ink-700 text-muted hover:text-cream'
                  }`}
                  aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                  aria-pressed={isListening}
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z"/>
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                  </svg>
                </button>
              )}
            </div>

            <button
              id="submit-answer"
              onClick={submitAnswer}
              disabled={!answer.trim() || loading}
              className={`w-full mt-3 py-3 rounded-lg font-sans font-semibold text-sm transition-smooth ${
                answer.trim() && !loading
                  ? 'bg-amber text-ink-900 hover:bg-amber-dark active:scale-[0.98]'
                  : 'bg-ink-700 text-muted cursor-not-allowed'
              }`}
            >
              Submit answer
            </button>
          </div>
        )}

        {loading && currentQuestion && (
          <div className="flex items-center justify-center gap-2 py-4">
            <span className="text-muted text-sm font-sans">Vera is thinking</span>
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-muted"
                  style={{ animation: `avatar-thinking-dot 1.2s ease-in-out ${i * 0.2}s infinite` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════
   SUMMARY SCREEN
   ═══════════════════════════════════════════════════════════════════════════ */
function SummaryScreen({ scores, summary, lastFeedback, lastScore, onRestart }) {
  const allScores = lastScore != null ? [...scores, lastScore] : scores;
  // Deduplicate — if lastScore is already in scores, just use scores
  const finalScores = allScores.length > 5 ? allScores.slice(0, 5) : allScores;
  const avg = finalScores.length > 0
    ? (finalScores.reduce((a, b) => a + b, 0) / finalScores.length).toFixed(1)
    : '—';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg animate-fade-up">
        {/* Average score */}
        <div className="text-center mb-8">
          <Avatar state="idle" />
          <p className="text-sm text-muted uppercase tracking-wider font-sans font-medium mt-4 mb-2">Session complete</p>
          <p className="font-serif text-5xl sm:text-6xl font-bold text-cream" style={{ fontFamily: 'Fraunces, Georgia, serif' }}>
            {avg}<span className="text-2xl text-muted font-normal">/5</span>
          </p>
          <p className="text-muted text-sm font-sans mt-1">Average score across {finalScores.length} questions</p>
        </div>

        {/* Per-question chips */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {finalScores.map((s, i) => (
            <ScoreChip key={i} score={s} index={i} label={`Q${i + 1}`} />
          ))}
        </div>

        {/* Last feedback */}
        {lastFeedback && (
          <div className="bg-ink-800 border border-ink-700 rounded-lg p-4 mb-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-muted uppercase tracking-wider font-sans font-medium">Last answer</span>
              {lastScore != null && (
                <span className={`text-sm font-bold font-serif ${
                  lastScore >= 4 ? 'text-pass' : lastScore <= 2 ? 'text-fail' : 'text-cream'
                }`}>
                  {lastScore}/5
                </span>
              )}
            </div>
            <p className="text-muted text-sm font-sans leading-relaxed">{lastFeedback}</p>
          </div>
        )}

        {/* Coach's note */}
        {summary && (
          <div className="bg-ink-800 border border-amber/20 rounded-lg p-5 mb-8 animate-fade-up" style={{ animationDelay: '0.5s' }}>
            <p className="text-xs text-amber uppercase tracking-wider font-sans font-medium mb-2">Coach's note</p>
            <p className="text-cream text-sm font-sans leading-relaxed">{summary}</p>
          </div>
        )}

        {/* Restart */}
        <button
          id="restart-session"
          onClick={onRestart}
          className="w-full py-3.5 rounded-lg font-sans font-semibold text-base bg-amber text-ink-900 hover:bg-amber-dark active:scale-[0.98] transition-smooth"
        >
          Run another session
        </button>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE — state machine routing between screens
   ═══════════════════════════════════════════════════════════════════════════ */
export default function Home() {
  const [screen, setScreen] = useState('setup'); // setup | interview | summary
  const [config, setConfig] = useState({ track: '', difficulty: '' });
  const [result, setResult] = useState(null);

  const handleStart = (track, difficulty) => {
    setConfig({ track, difficulty });
    setScreen('interview');
  };

  const handleComplete = (data) => {
    setResult(data);
    setScreen('summary');
  };

  const handleRestart = () => {
    setResult(null);
    setConfig({ track: '', difficulty: '' });
    setScreen('setup');
  };

  if (screen === 'interview') {
    return (
      <InterviewScreen
        track={config.track}
        difficulty={config.difficulty}
        onComplete={handleComplete}
      />
    );
  }

  if (screen === 'summary') {
    return (
      <SummaryScreen
        scores={result?.scores || []}
        summary={result?.summary}
        lastFeedback={result?.feedback}
        lastScore={result?.lastScore}
        onRestart={handleRestart}
      />
    );
  }

  return <SetupScreen onStart={handleStart} />;
}
