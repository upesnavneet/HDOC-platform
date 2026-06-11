import React, { createContext, useContext, useState, useEffect } from 'react';
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
  });
  const [dbError, setDbError] = useState(null);

  useEffect(() => {
    const unsubs = [];

    seedFirestoreIfEmpty().catch((err) => console.warn('[Seed] Seeding skipped:', err));

    // Check and auto-advance day after 24 hours
    checkAndAutoAdvanceDay().then((newDay) => {
      if (newDay) {
        console.log(`[Auto-Advance] Day advanced to ${newDay}`);
      }
    });

    try {
      unsubs.push(
        subscribeToSystemConfig((config) => {
          const normalized = normalizeSystemConfig(config);

          if (normalized.needsRepair) {
            updateSystemConfig({
              currentDay: normalized.currentDay,
              simulatedTime: normalized.simulatedTime,
              completedWeeks: normalized.completedWeeks,
            }).catch((err) => console.error('Failed to repair system config:', err));
          }

          setDb((prev) => ({
            ...prev,
            currentDay: normalized.currentDay,
            simulatedTime: normalized.simulatedTime,
            completedWeeks: normalized.completedWeeks,
          }));
        })
      );

      unsubs.push(subscribeToQuestions((qs) => setDb((prev) => ({ ...prev, questions: qs }))));

      // H3: Scope submission subscription to the current user.
      // Admins get all submissions (needed for coordinator grading views).
      // Participants get only their own submissions.
      if (currentUser) {
        if (currentUser.isAdmin) {
          unsubs.push(subscribeToSubmissions((subs) => setDb((prev) => ({ ...prev, submissions: subs }))));
        } else {
          const uid = currentUser.uid || currentUser.id;
          unsubs.push(subscribeToUserSubmissions(uid, (subs) => setDb((prev) => ({ ...prev, submissions: subs }))));
        }
      }

      unsubs.push(subscribeToUsers((us) => setDb((prev) => ({ ...prev, users: us }))));

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
        subscribeToDebuggingChallenges((challenges) => {
          currentChallenges = challenges;
          updateDebugChallenges();
        })
      );

      unsubs.push(
        subscribeToDebuggingSubmissions((subs) => {
          currentDebugSubs = subs;
          updateDebugChallenges();
        })
      );
    } catch (error) {
      console.error('Firestore subscription failed:', error);
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
