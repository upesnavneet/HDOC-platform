import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import AdvanceTimer from '../components/AdvanceTimer';

/* ── helpers ── */

const getCurrentWeek = (currentDay) => {
  const day = Number(currentDay);
  if (!Number.isFinite(day) || day < 1) return 1;
  return Math.ceil(day / 7);
};

function getChallengeWindow(simulatedTime, debuggingChallenges, currentWeek) {
  const now = new Date(simulatedTime);
  const match = debuggingChallenges.find((c) => c.week === currentWeek);

  if (match) {
    const pubTime = new Date(match.publishedDate);
    if (now >= pubTime) {
      const deadline = new Date(pubTime.getTime() + 24 * 60 * 60 * 1000);
      const diff = Math.max(0, deadline - now);
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return {
        activeChallenge: match,
        timeStatus: 'open',
        isChallengeOpen: true,
        countdown: `${h}h ${m}m remaining`,
      };
    }
    const diff = pubTime - now;
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return {
      activeChallenge: match,
      timeStatus: 'upcoming',
      isChallengeOpen: false,
      countdown: `Starts in ${h}h ${m}m`,
    };
  }

  const nextWeek = currentWeek + 1;
  const nextChallenge = debuggingChallenges.find((c) => c.week === nextWeek);
  if (nextChallenge) {
    const pubTime = new Date(nextChallenge.publishedDate);
    const diff = pubTime - now;
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return {
      activeChallenge: null,
      timeStatus: 'closed',
      isChallengeOpen: false,
      countdown: `Week ${nextWeek} challenge in ${d} days, ${h} hours (Sunday 21:00)`,
    };
  }

  return {
    activeChallenge: null,
    timeStatus: 'closed',
    isChallengeOpen: false,
    countdown: 'No upcoming debugging challenge scheduled.',
  };
}

/* ── Simple C/C++ syntax highlighter ── */

function highlightCode(code) {
  if (!code) return { __html: '' };

  // Escape HTML first
  let escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Order matters: comments first, then strings, then keywords/types/functions
  const rules = [
    // Single-line comments
    { pattern: /(\/\/[^\n]*)/g, cls: 'code-comment' },
    // Multi-line comments
    { pattern: /(\/\*[\s\S]*?\*\/)/g, cls: 'code-comment' },
    // String literals (double-quoted and angle-bracket includes)
    { pattern: /(&quot;[^&]*?&quot;|"[^"]*?")/g, cls: 'code-string' },
    { pattern: /(&lt;[a-zA-Z_][a-zA-Z0-9_/.]*&gt;)/g, cls: 'code-string' },
  ];

  // Apply comment and string rules first
  const tokens = [];
  let tokenized = escaped;
  let tokenId = 0;

  for (const rule of rules) {
    tokenized = tokenized.replace(rule.pattern, (match) => {
      const placeholder = `__TOKEN_${tokenId}__`;
      tokens.push({ placeholder, html: `<span class="${rule.cls}">${match}</span>` });
      tokenId++;
      return placeholder;
    });
  }

  // C++ keywords
  const keywords =
    /\b(#include|#define|#pragma|#ifndef|#endif|#ifdef|using|namespace|return|if|else|for|while|do|switch|case|break|continue|class|struct|public|private|protected|virtual|override|const|static|void|int|char|bool|float|double|long|unsigned|auto|template|typename|new|delete|throw|try|catch|nullptr)\b/g;
  tokenized = tokenized.replace(keywords, '<span class="code-keyword">$1</span>');

  // Standard library types and namespaces
  const types =
    /\b(std::[a-zA-Z_:]+|string|vector|map|set|pair|mutex|thread|lock_guard|scoped_lock|unique_lock|cout|cin|endl|chrono|this_thread|milliseconds|atomic)\b/g;
  tokenized = tokenized.replace(types, '<span class="code-type">$1</span>');

  // Function names (word followed by parenthesis)
  tokenized = tokenized.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g, (match, name) => {
    // Don't double-wrap keywords/types
    if (match.includes('class="')) return match;
    return `<span class="code-function">${name}</span>(`.slice(0, -1);
  });

  // Restore tokens
  for (const { placeholder, html } of tokens) {
    tokenized = tokenized.replace(placeholder, html);
  }

  return { __html: tokenized };
}

function getLineCount(code) {
  if (!code) return 0;
  return code.split('\n').length;
}

/**
 * Derives the display filename from the starter code content or challenge data.
 * Falls back to a sensible default. This allows the admin to control the
 * filename via challenge data in the future (e.g. challenge.fileName).
 */
function getCodeFileName(challenge) {
  if (challenge?.fileName) return challenge.fileName;
  // Infer from code content if possible
  const code = challenge?.starterCode || '';
  if (code.includes('#include') || code.includes('std::')) return 'starter_code.cpp';
  if (code.includes('def ') || code.includes('import ')) return 'starter_code.py';
  if (code.includes('function ') || code.includes('const ') || code.includes('let '))
    return 'starter_code.js';
  if (code.includes('public class') || code.includes('System.out')) return 'StarterCode.java';
  return 'starter_code.txt';
}

/* ── SVG icon components (inline to avoid external deps) ── */

const ErrorCircleIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
  </svg>
);

const LightbulbIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: 16, height: 16 }}
  >
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: 16, height: 16 }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const FileIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: 14, height: 14 }}
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const CopyIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const LinkIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);

const LockIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: 14, height: 14 }}
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

/* ── Main Component ── */

export default function Debugging() {
  const { db, currentUser, submitDebuggingChallenge } = useApp();
  const [submitMsg, setSubmitMsg] = useState('');
  const [tick, setTick] = useState(0);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const userId = currentUser?.uid || currentUser?.id;
  const currentWeek = getCurrentWeek(db.currentDay);

  const windowState = useMemo(
    () => getChallengeWindow(db.simulatedTime, db.debuggingChallenges, currentWeek),
    // tick forces countdown refresh while challenge is upcoming/open
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db.simulatedTime, db.debuggingChallenges, currentWeek, tick]
  );

  const { activeChallenge, timeStatus, isChallengeOpen } = windowState;

  if (db.currentDay % 7 !== 0) {
    return (
      <div className="debugging-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#F2AA4C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1.5rem' }}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#F3F3F3' }}>Debugging Locked</h2>
        <p style={{ fontSize: '1.1rem', color: 'rgba(243, 243, 243, 0.7)', maxWidth: '500px', lineHeight: 1.6 }}>
          Today is Day {db.currentDay}. Debugging Challenges are only available on Sundays (Day 7, 14, 21, etc.). Please return to the <strong>Challenges tab</strong>.
        </p>
      </div>
    );
  }

  useEffect(() => {
    if (timeStatus !== 'upcoming' && timeStatus !== 'open') return undefined;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [timeStatus]);

  const activeChallengeSub = activeChallenge?.submissions?.find((s) => s.userId === userId);
  const gitLinkDefault = activeChallengeSub?.link || '';

  const handleSub = async (e) => {
    e.preventDefault();
    setSubmitMsg('');
    const link = new FormData(e.currentTarget).get('git-debug-link')?.toString().trim();
    if (!link) {
      setSubmitMsg('GitHub Repository Push link is required.');
      return;
    }
    if (!activeChallenge) {
      setSubmitMsg('No active debugging challenge for this week.');
      return;
    }
    const res = await submitDebuggingChallenge(activeChallenge.id, link);
    setSubmitMsg(res.success ? res.message : `Error: ${res.message}`);
  };

  const handleCopyCode = useCallback(() => {
    if (activeChallenge?.starterCode) {
      navigator.clipboard.writeText(activeChallenge.starterCode).then(() => {
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
      });
    }
  }, [activeChallenge?.starterCode]);

    const codeContent = activeChallenge?.starterCode || '';
  const lineCount = getLineCount(codeContent);
  const fileName = getCodeFileName(activeChallenge);

  const symptoms = activeChallenge?.symptoms || [
    'Application freezes during high-volume concurrent operations.',
    'CPU utilization drops to 0% while threads are stuck in waiting states.',
    'Thread dumps show threads permanently blocked on resource acquisition.',
  ];
  const hints = activeChallenge?.hints || [
    {
      title: 'Hint 1: Resource Ordering',
      body: 'Look closely at the order in which different threads attempt to lock shared resources. A consistent ordering can prevent circular dependencies.',
    },
    {
      title: 'Hint 2: Standard Library Solutions',
      body: 'Consider using mechanisms that acquire multiple locks simultaneously without deadlock risk. Many languages provide built-in utilities for this.',
    },
  ];

  if (timeStatus === 'open' && activeChallenge) {
    return (
      <div className="debugging-container">
        {/* ═══ IDE-style split workspace ═══ */}
        <div className="debug-workspace">
          {/* ─── Left Panel: Problem Description ─── */}
          <section className="debug-problem-panel">
            <div className="debug-problem-content">
              {/* Breadcrumbs */}
              <div className="debug-breadcrumbs">
                <span>Week {activeChallenge.week}</span>
                <span className="chevron">›</span>
                <span className="breadcrumb-current">{activeChallenge.theme}</span>
              </div>

              {/* Title + Meta */}
              <div className="debug-title-row">
                <h1>
                  Week {activeChallenge.week} — {activeChallenge.theme}
                </h1>
              </div>

              {/* Timer */}
              <div className="debug-timer-badge">
                <span className="pulse-dot" aria-hidden="true" />
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AdvanceTimer hideIcon={true} /> remaining
                </span>
              </div>

              {/* Challenge Brief */}
              <div className="debug-section">
                <h2 className="debug-section-heading">Challenge Brief</h2>
                <p className="debug-brief-text">{activeChallenge.description}</p>
              </div>

              {/* Observed Symptoms — driven by challenge data */}
              <div className="debug-section">
                <h2 className="debug-section-heading">Observed Symptoms</h2>
                <ul className="debug-symptoms-list">
                  {symptoms.map((symptom, i) => (
                    <li key={i} className="debug-symptom-item">
                      <span className="debug-symptom-icon">
                        <ErrorCircleIcon />
                      </span>
                      <span className="debug-symptom-text">{symptom}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Hint System — driven by challenge data */}
              <div className="debug-hints-section">
                <h2 className="debug-section-heading">Hint System</h2>
                {hints.map((hint, i) => (
                  <details key={i} className="debug-hint-accordion">
                    <summary>
                      <div className="debug-hint-summary-left">
                        <span className="debug-hint-icon">
                          <LightbulbIcon />
                        </span>
                        {hint.title}
                      </div>
                      <span className="debug-hint-chevron">
                        <ChevronDownIcon />
                      </span>
                    </summary>
                    <div className="debug-hint-content">{hint.body}</div>
                  </details>
                ))}
              </div>

              {/* Submission Status (if submitted) */}
              {activeChallengeSub && (
                <div className="debug-grading-box">
                  <span className="label">Submission Status: </span>
                  <span className="badge-status submitted">Submitted</span>
                  {activeChallengeSub.score !== null && activeChallengeSub.score !== undefined ? (
                    <div className="grade-result">
                      <strong>Score Awarded:</strong> {activeChallengeSub.score} / 20
                    </div>
                  ) : (
                    <div className="grade-result pending">
                      Awaiting evaluation by the Technical Head.
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* ─── Split Divider ─── */}
          <div className="debug-split-divider" />

          {/* ─── Right Panel: Code Viewer ─── */}
          <section className="debug-code-panel">
            {/* IDE Tab Bar */}
            <div className="debug-ide-tabs">
              <div className="debug-ide-tab">
                <span className="tab-icon">
                  <FileIcon />
                </span>
                <span className="tab-name">{fileName}</span>
              </div>
            </div>

            {/* Editor Toolbar — Prominent Read-Only banner */}
            <div className="debug-editor-toolbar">
              <div className="debug-readonly-banner" aria-label="This file is read-only">
                <LockIcon />
                <span>Read-Only</span>
              </div>
              <div className="debug-toolbar-actions">
                <button
                  className="debug-toolbar-btn"
                  title={copyFeedback ? 'Copied!' : 'Copy Code'}
                  onClick={handleCopyCode}
                  aria-label="Copy code to clipboard"
                >
                  <CopyIcon />
                </button>
              </div>
            </div>

            {/* Code Display Area — content driven by activeChallenge.starterCode */}
            <div className="debug-code-area">
              {/* Line Numbers */}
              <div className="debug-line-numbers">
                {Array.from({ length: lineCount }, (_, i) => (
                  <span key={i + 1}>{i + 1}</span>
                ))}
              </div>
              {/* Syntax-Highlighted Code */}
              <div
                className="debug-code-content"
                dangerouslySetInnerHTML={highlightCode(codeContent)}
              />
            </div>

            {/* Sticky Submission Dock */}
            <form
              className="debug-submission-dock"
              onSubmit={handleSub}
              key={activeChallengeSub?.timestamp || 'new'}
            >
              <div className="debug-url-input-wrap">
                <span className="input-icon">
                  <LinkIcon />
                </span>
                <input
                  className="debug-url-input"
                  id="git-debug-link"
                  name="git-debug-link"
                  type="url"
                  placeholder="GitHub Solution URL"
                  defaultValue={gitLinkDefault}
                  required
                  spellCheck={false}
                  autoComplete="off"
                />
              </div>
              {submitMsg && (
                <span className="debug-submit-msg" role="alert">
                  {submitMsg}
                </span>
              )}
              <button type="submit" className="debug-submit-btn">
                <SendIcon />
                {activeChallengeSub ? 'Update Fix' : 'Submit Fix'}
              </button>
            </form>
          </section>
        </div>
      </div>
    );
  }

  // ═══ Closed or Upcoming State ═══
  return (
    <div className="debugging-container">
      <div className="debug-closed-state">
        <div className="lock-icon">🔒</div>
        {timeStatus === 'upcoming' && activeChallenge ? (
          <>
            <h2>
              Week {activeChallenge.week} Challenge: {activeChallenge.theme}
            </h2>
            <p className="upcoming-note">
              This week&apos;s debugging challenge goes live at 21:00 tonight. Come back then to
              start.
            </p>
            <div className="debug-closed-timer" style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
              <AdvanceTimer hideIcon={true} />
            </div>
          </>
        ) : (
          <>
            <h2>No active challenge right now</h2>
            <p className="upcoming-note" style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
              <AdvanceTimer hideIcon={true} />
            </p>
            <div className="debug-rules-grid">
              <div className="debug-rule-card">
                <span className="number">01</span>
                <h4>Sundays Release</h4>
              </div>
              <div className="debug-rule-card">
                <span className="number">02</span>
                <h4>GitHub Submissions</h4>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
