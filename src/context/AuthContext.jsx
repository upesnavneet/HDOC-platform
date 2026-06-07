import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth';
import { getUserProfile, createUserProfile, getAllUsers } from '../services/userService';

const AuthContext = createContext();

const initialState = {
  currentUser: null,
  loading: true,
  error: null
};

function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, loading: true, error: null };
    case 'AUTH_SUCCESS':
      return { ...state, currentUser: action.payload, loading: false, error: null };
    case 'AUTH_FAIL':
      return { ...state, currentUser: null, loading: false, error: action.payload };
    case 'LOGOUT':
      return { ...state, currentUser: null, loading: false, error: null };
    default:
      return state;
  }
}

// Password validation: min 8 chars, 1 number, 1 special char
const validatePassword = (password) => {
  const regex = /^(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
  return regex.test(password);
};

// Check if we are running in local mock fallback mode
const isMockMode = () => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  return !apiKey || apiKey.startsWith('mock-');
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check 7 days inactivity on startup
  useEffect(() => {
    const checkInactivity = () => {
      const lastActivity = localStorage.getItem('acm_100doc_last_activity');
      if (lastActivity) {
        const timeElapsed = Date.now() - Number(lastActivity);
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        if (timeElapsed > sevenDays) {
          console.log('Session expired due to 7 days of inactivity.');
          if (isMockMode()) {
            dispatch({ type: 'LOGOUT' });
            sessionStorage.removeItem('acm_100_days_session');
          } else {
            signOut(auth);
            dispatch({ type: 'LOGOUT' });
          }
          localStorage.removeItem('acm_100doc_last_activity');
        }
      }
    };
    checkInactivity();
  }, []);

  // Update activity timestamp on user interaction
  const updateActivity = () => {
    localStorage.setItem('acm_100doc_last_activity', Date.now().toString());
  };

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const updateHandler = () => updateActivity();
    events.forEach(event => window.addEventListener(event, updateHandler));
    return () => {
      events.forEach(event => window.removeEventListener(event, updateHandler));
    };
  }, []);

  // Set up Auth State Listener (or load mock session)
  useEffect(() => {
    if (isMockMode()) {
      // Mock Fallback session loading
      const sessionUser = sessionStorage.getItem('acm_100_days_session');
      if (sessionUser) {
        try {
          const parsed = JSON.parse(sessionUser);
          // Reload from local storage db to get fresh scores
          const localDbRaw = localStorage.getItem('acm_100_days_db');
          if (localDbRaw) {
            const localDb = JSON.parse(localDbRaw);
            const freshUser = localDb.users.find(u => u.id === parsed.id);
            if (freshUser) {
              dispatch({ type: 'AUTH_SUCCESS', payload: freshUser });
              return;
            }
          }
          dispatch({ type: 'AUTH_SUCCESS', payload: parsed });
        } catch (e) {
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'LOGOUT' });
      }
      return;
    }

    // Real Firebase listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          if (profile) {
            if (profile.role === 'participant' && !profile.isActive) {
              await signOut(auth);
              dispatch({ type: 'AUTH_FAIL', payload: 'Your account has been deactivated by the administrator.' });
            } else {
              dispatch({ type: 'AUTH_SUCCESS', payload: profile });
              updateActivity();
            }
          }
        } catch (error) {
          dispatch({ type: 'AUTH_FAIL', payload: 'Failed to synchronize user profile.' });
        }
      } else {
        dispatch({ type: 'LOGOUT' });
      }
    });

    return unsubscribe;
  }, []);

  // Login handler
  const login = async (email, password) => {
    dispatch({ type: 'AUTH_START' });

    // Lockout protection: 5 attempts -> 15 min lock
    const failedAttemptsKey = `acm_100doc_failed_${email.toLowerCase()}`;
    const lockoutKey = `acm_100doc_lockout_${email.toLowerCase()}`;

    const failedAttempts = Number(localStorage.getItem(failedAttemptsKey) || 0);
    const lockoutTime = Number(localStorage.getItem(lockoutKey) || 0);

    if (lockoutTime && Date.now() < lockoutTime) {
      const remainingMin = Math.ceil((lockoutTime - Date.now()) / (60 * 1000));
      const errMsg = `Account locked. Please try again after ${remainingMin} minutes.`;
      dispatch({ type: 'AUTH_FAIL', payload: errMsg });
      return { success: false, message: errMsg };
    }

    // Mock Mode Fallback
    if (isMockMode()) {
      const dbRaw = localStorage.getItem('acm_100_days_db');
      if (dbRaw) {
        try {
          const localDb = JSON.parse(dbRaw);
          const foundUser = localDb.users.find(
            u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
          );

          if (!foundUser) {
            throw new Error('Invalid credentials');
          }

          if (foundUser.role === 'participant' && !foundUser.isActive) {
            const errMsg = 'Your account has been deactivated by the administrator.';
            dispatch({ type: 'AUTH_FAIL', payload: errMsg });
            return { success: false, message: errMsg };
          }

          // Reset lockout
          localStorage.removeItem(failedAttemptsKey);
          localStorage.removeItem(lockoutKey);

          dispatch({ type: 'AUTH_SUCCESS', payload: foundUser });
          sessionStorage.setItem('acm_100_days_session', JSON.stringify(foundUser));
          updateActivity();
          return { success: true, user: foundUser };

        } catch (e) {
          // Increment lockout
          const newAttempts = failedAttempts + 1;
          localStorage.setItem(failedAttemptsKey, newAttempts.toString());
          let errMsg = 'Invalid User ID or Password.';
          if (newAttempts >= 5) {
            const lockExpiration = Date.now() + 15 * 60 * 1000;
            localStorage.setItem(lockoutKey, lockExpiration.toString());
            errMsg = 'Invalid User ID or Password. Account locked for 15 minutes.';
          }
          dispatch({ type: 'AUTH_FAIL', payload: errMsg });
          return { success: false, message: errMsg };
        }
      }
    }

    // Real Firebase Mode
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const profile = await getUserProfile(userCredential.user.uid);

      if (!profile) {
        throw new Error('User profile does not exist in the database.');
      }

      if (profile.role === 'participant' && !profile.isActive) {
        await signOut(auth);
        const errMsg = 'Your account has been deactivated by the administrator.';
        dispatch({ type: 'AUTH_FAIL', payload: errMsg });
        return { success: false, message: errMsg };
      }

      // Reset lockout counters on success
      localStorage.removeItem(failedAttemptsKey);
      localStorage.removeItem(lockoutKey);

      dispatch({ type: 'AUTH_SUCCESS', payload: profile });
      updateActivity();
      return { success: true, user: profile };
    } catch (error) {
      const newAttempts = failedAttempts + 1;
      localStorage.setItem(failedAttemptsKey, newAttempts.toString());

      let errMsg = 'Invalid User ID or Password.';
      if (newAttempts >= 5) {
        const lockExpiration = Date.now() + 15 * 60 * 1000; // 15 mins
        localStorage.setItem(lockoutKey, lockExpiration.toString());
        errMsg = 'Invalid User ID or Password. Account locked for 15 minutes.';
      }

      dispatch({ type: 'AUTH_FAIL', payload: errMsg });
      return { success: false, message: errMsg };
    }
  };

  // Register handler
  const register = async (name, email, password, studentId, gitHubId, leetCodeId) => {
    dispatch({ type: 'AUTH_START' });

    // 1. Password complexity check
    if (!validatePassword(password)) {
      const errMsg = 'Password must be at least 8 characters long, contain at least 1 number, and 1 special character.';
      dispatch({ type: 'AUTH_FAIL', payload: errMsg });
      return { success: false, message: errMsg };
    }

    // Mock Mode Fallback
    if (isMockMode()) {
      const dbRaw = localStorage.getItem('acm_100_days_db');
      if (dbRaw) {
        try {
          const localDb = JSON.parse(dbRaw);
          const emailExists = localDb.users.some(u => u.email.toLowerCase() === email.toLowerCase());
          if (emailExists) {
            const errMsg = 'Email already registered.';
            dispatch({ type: 'AUTH_FAIL', payload: errMsg });
            return { success: false, message: errMsg };
          }
          const studentIdExists = localDb.users.some(u => u.studentId.toUpperCase() === studentId.toUpperCase());
          if (studentIdExists) {
            const errMsg = 'Student ID already registered.';
            dispatch({ type: 'AUTH_FAIL', payload: errMsg });
            return { success: false, message: errMsg };
          }

          const newProfile = {
            id: `user-${Date.now()}`,
            name,
            email,
            password, // Stored directly in mock db
            role: 'participant',
            studentId,
            gitHubId,
            leetCodeId,
            gitHubStreak: 0,
            leetCodeStreak: 0,
            totalCodingScore: 0,
            totalDebuggingScore: 0,
            overallRank: localDb.users.filter(u => u.role === 'participant').length + 1,
            isActive: true,
            completedDays: [],
            createdAt: new Date().toISOString()
          };

          // Save to local storage mock db directly
          localDb.users.push(newProfile);
          localStorage.setItem('acm_100_days_db', JSON.stringify(localDb));

          dispatch({ type: 'AUTH_SUCCESS', payload: newProfile });
          sessionStorage.setItem('acm_100_days_session', JSON.stringify(newProfile));
          updateActivity();
          return { success: true, user: newProfile };

        } catch (e) {
          const errMsg = 'Registration failed. Please try again.';
          dispatch({ type: 'AUTH_FAIL', payload: errMsg });
          return { success: false, message: errMsg };
        }
      }
    }

    // Real Firebase Mode
    try {
      // 2. Uniqueness check for Student SAP ID
      const allUsers = await getAllUsers();
      const studentIdExists = allUsers.some(
        u => u.studentId && u.studentId.toUpperCase() === studentId.toUpperCase()
      );
      if (studentIdExists) {
        const errMsg = 'Student ID already registered.';
        dispatch({ type: 'AUTH_FAIL', payload: errMsg });
        return { success: false, message: errMsg };
      }

      const emailExists = allUsers.some(
        u => u.email.toLowerCase() === email.toLowerCase()
      );
      if (emailExists) {
        const errMsg = 'Email already registered.';
        dispatch({ type: 'AUTH_FAIL', payload: errMsg });
        return { success: false, message: errMsg };
      }

      // 3. Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // 4. Create Firestore user document
      const newProfile = {
        uid: uid,
        id: uid,
        name: name,
        email: email,
        studentId: studentId,
        gitHubId: gitHubId,
        leetCodeId: leetCodeId,
        role: 'participant',
        gitHubStreak: 0,
        leetCodeStreak: 0,
        totalCodingScore: 0,
        totalDebuggingScore: 0,
        overallRank: allUsers.filter(u => u.role === 'participant').length + 1,
        isActive: true,
        completedDays: [],
        createdAt: new Date().toISOString()
      };

      await createUserProfile(uid, newProfile);
      dispatch({ type: 'AUTH_SUCCESS', payload: newProfile });
      updateActivity();
      return { success: true, user: newProfile };
    } catch (error) {
      console.error('Registration failed:', error);
      const errMsg = error.message || 'Registration failed. Please try again.';
      dispatch({ type: 'AUTH_FAIL', payload: errMsg });
      return { success: false, message: errMsg };
    }
  };

  // Logout handler
  const logout = async () => {
    if (isMockMode()) {
      dispatch({ type: 'LOGOUT' });
      sessionStorage.removeItem('acm_100_days_session');
      return;
    }
    try {
      await signOut(auth);
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Password reset handler
  const resetPassword = async (email) => {
    if (isMockMode()) {
      return { success: true };
    }
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      console.error('Password reset failed:', error);
      return { success: false, message: error.message };
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser: state.currentUser,
      loading: state.loading,
      error: state.error,
      login,
      register,
      logout,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
