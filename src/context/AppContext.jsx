import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { DataProvider, useData } from './DataContext';
import { AppActionsProvider, useAppActions } from './AppActionsContext';

const AppContext = createContext(null);

function getOverallRank(userId, allUsers) {
  // B6: exclude admin accounts from rank computation
  const participants = allUsers
    .filter((u) => !u.isAdminAccount)
    .sort((a, b) => {
      const scoreA = (a.totalCodingScore || 0) + (a.totalDebuggingScore || 0);
      const scoreB = (b.totalCodingScore || 0) + (b.totalDebuggingScore || 0);
      return scoreB - scoreA;
    });
  const index = participants.findIndex((u) => (u.uid || u.id) === userId);
  return index !== -1 ? index + 1 : '-';
}

function AppContextBridge({ children }) {
  const { currentUser, login, logout, register, resetPassword } = useAuth();
  const { db, dbError } = useData();
  const actions = useAppActions();

  const currentUserWithRank = useMemo(() => {
    if (!currentUser) return null;
    return {
      ...currentUser,
      overallRank: getOverallRank(currentUser.uid || currentUser.id, db.users),
    };
  }, [currentUser, db.users]);

  const value = useMemo(
    () => ({
      db,
      dbError,
      currentUser: currentUserWithRank,
      login,
      logout,
      register,
      resetPassword,
      ...actions,
    }),
    [db, dbError, currentUserWithRank, login, logout, register, resetPassword, actions]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function AppProvider({ children }) {
  return (
    <DataProvider>
      <AppActionsProvider>
        <AppContextBridge>{children}</AppContextBridge>
      </AppActionsProvider>
    </DataProvider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
