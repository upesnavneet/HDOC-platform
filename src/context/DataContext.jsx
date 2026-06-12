import React, { createContext, useContext, useState, useEffect } from 'react';
import { log, warn, error as logError } from '../utils/logger';
import { useAuth } from './AuthContext';
import { subscribeToUsers } from '../services/userService';
import { subscribeToQuestions } from '../services/questionService';
import {
  subscribeToSubmissions,
  subscribeToUserSubmissions,
  subscribeToDebuggingChallenges,
  subscribeToDebuggingSubmissions,
  subscribeToSystemConfig,
  updateSystemConfig,
  checkAndAutoAdvanceDay,
} from '../services/completionService';
import { seedFirestoreIfEmpty } from '../utils/seedFirestore';
import { getDefaultSystemConfig, normalizeSystemConfig } from '../utils/eventConfig';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { currentUser } = useAuth();
  const defaultConfig = getDefaultSystemConfig();
  const [db, setDb] = useState({
    users: [],
    questions: [],
    submissions: [],
    debuggingChallenges: [],
    currentDay: defaultConfig.currentDay,
    simulatedTime: defaultConfig.simulatedTime,
    completedWeeks: defaultConfig.completedWeeks,
    // B1: event start date read from system/config (null until loaded)
    eventStartDate: null,
    // D1: max scores read from system/config; safe defaults match current rules
    maxCodingScore: 10,
    maxDebugScore: 20,
  });
  const [dbError, setDbError] = useState(null);

  useEffect(() => {
    const unsubs = [];

    // M11: Only seed in development — prevents unnecessary production Firestore reads.
    if (import.meta.env.DEV) {
      seedFirestoreIfEmpty().catch((err) => warn('[Seed] Seeding skipped:', err));
    }

    // Check and auto-advance day after 24 hours
    checkAndAutoAdvanceDay().then((newDay) => {
      if (newDay) {
        log(`[Auto-Advance] Day advanced to ${newDay}`);
      }
    });

    // B5: shared error handler — sets a banner message without crashing the app
    const onSubError = (label) => (err) => {
      logError(`[${label}] Subscription error:`, err);
      setDbError('Connection issue — data may be out of date. Please refresh.');
    };

    try {
      unsubs.push(
        subscribeToSystemConfig(
          (config) => {
            const normalized = normalizeSystemConfig(config);

            if (normalized.needsRepair) {
              updateSystemConfig({
                currentDay: normalized.currentDay,
                simulatedTime: normalized.simulatedTime,
                completedWeeks: normalized.completedWeeks,
              }).catch((err) => logError('Failed to repair system config:', err));
            }

            setDb((prev) => ({
              ...prev,
              currentDay: normalized.currentDay,
              simulatedTime: normalized.simulatedTime,
              completedWeeks: normalized.completedWeeks,
              // B1: pass event start date through directly; no normalization needed
              eventStartDate: config?.eventStartDate || prev.eventStartDate,
              // D1: coordinator-configurable max scores; fallback to safe defaults
              maxCodingScore: config?.maxCodingScore ?? prev.maxCodingScore,
              maxDebugScore: config?.maxDebugScore ?? prev.maxDebugScore,
            }));
          },
          onSubError('SystemConfig')
        )
      );

      unsubs.push(
        subscribeToQuestions(
          (qs) => setDb((prev) => ({ ...prev, questions: qs })),
          onSubError('Questions')
        )
      );

      // H3: Scope submission subscription to the current user.
      // Admins get all submissions (needed for coordinator grading views).
      // Participants get only their own submissions.
      if (currentUser) {
        if (currentUser.isAdmin) {
          unsubs.push(
            subscribeToSubmissions(
              (subs) => setDb((prev) => ({ ...prev, submissions: subs })),
              onSubError('Submissions')
            )
          );
        } else {
          const uid = currentUser.uid || currentUser.id;
          unsubs.push(
            subscribeToUserSubmissions(
              uid,
              (subs) => setDb((prev) => ({ ...prev, submissions: subs })),
              onSubError('UserSubmissions')
            )
          );
        }
      }

      unsubs.push(
        subscribeToUsers(
          (us) => setDb((prev) => ({ ...prev, users: us })),
          onSubError('Users')
        )
      );

      let currentChallenges = [];
      let currentDebugSubs = [];

      const updateDebugChallenges = () => {
        const merged = currentChallenges.map((c) => ({
          ...c,
          submissions: currentDebugSubs.filter((s) => s.challengeId === c.id),
        }));
        setDb((prev) => ({ ...prev, debuggingChallenges: merged }));
      };

      unsubs.push(
        subscribeToDebuggingChallenges(
          (challenges) => {
            currentChallenges = challenges;
            updateDebugChallenges();
          },
          onSubError('DebuggingChallenges')
        )
      );

      unsubs.push(
        subscribeToDebuggingSubmissions(
          (subs) => {
            currentDebugSubs = subs;
            updateDebugChallenges();
          },
          onSubError('DebuggingSubmissions')
        )
      );
    } catch (error) {
      logError('Firestore subscription failed:', error);
      setDbError('Failed to load data. Please try again later.');
    }

    return () => unsubs.forEach((unsub) => unsub());
  }, [currentUser]);

  return <DataContext.Provider value={{ db, dbError }}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
