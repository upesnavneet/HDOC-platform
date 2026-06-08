import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import { getUserProfile, createUserProfile, getAllUsers } from '../services/userService';

const AuthContext = createContext();

const initialState = {
  currentUser: null,
  loading: true,
  error: null,
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

const validatePassword = (password) => {
  const regex = /^(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
  return regex.test(password);
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const lastActivity = localStorage.getItem('acm_100doc_last_activity');
    if (lastActivity) {
      const timeElapsed = Date.now() - Number(lastActivity);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (timeElapsed > sevenDays) {
        signOut(auth);
        dispatch({ type: 'LOGOUT' });
        localStorage.removeItem('acm_100doc_last_activity');
      }
    }
  }, []);

  const updateActivity = () => {
    localStorage.setItem('acm_100doc_last_activity', Date.now().toString());
  };

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const updateHandler = () => updateActivity();
    events.forEach((event) => window.addEventListener(event, updateHandler));
    return () => {
      events.forEach((event) => window.removeEventListener(event, updateHandler));
    };
  }, []);

  useEffect(() => {
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
        } catch {
          dispatch({ type: 'AUTH_FAIL', payload: 'Failed to synchronize user profile.' });
        }
      } else {
        dispatch({ type: 'LOGOUT' });
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    dispatch({ type: 'AUTH_START' });

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

      localStorage.removeItem(failedAttemptsKey);
      localStorage.removeItem(lockoutKey);

      dispatch({ type: 'AUTH_SUCCESS', payload: profile });
      updateActivity();
      return { success: true, user: profile };
    } catch {
      const newAttempts = failedAttempts + 1;
      localStorage.setItem(failedAttemptsKey, newAttempts.toString());

      let errMsg = 'Invalid email or password.';
      if (newAttempts >= 5) {
        const lockExpiration = Date.now() + 15 * 60 * 1000;
        localStorage.setItem(lockoutKey, lockExpiration.toString());
        errMsg = 'Invalid email or password. Account locked for 15 minutes.';
      }

      dispatch({ type: 'AUTH_FAIL', payload: errMsg });
      return { success: false, message: errMsg };
    }
  };

  const register = async (name, email, password, studentId, gitHubId, leetCodeId) => {
    dispatch({ type: 'AUTH_START' });

    if (!validatePassword(password)) {
      const errMsg = 'Password must be at least 8 characters long, contain at least 1 number, and 1 special character.';
      dispatch({ type: 'AUTH_FAIL', payload: errMsg });
      return { success: false, message: errMsg };
    }

    try {
      const allUsers = await getAllUsers();
      const studentIdExists = allUsers.some(
        (u) => u.studentId && u.studentId.toUpperCase() === studentId.toUpperCase()
      );
      if (studentIdExists) {
        const errMsg = 'Student ID already registered.';
        dispatch({ type: 'AUTH_FAIL', payload: errMsg });
        return { success: false, message: errMsg };
      }

      const emailExists = allUsers.some((u) => u.email.toLowerCase() === email.toLowerCase());
      if (emailExists) {
        const errMsg = 'Email already registered.';
        dispatch({ type: 'AUTH_FAIL', payload: errMsg });
        return { success: false, message: errMsg };
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      const newProfile = {
        uid,
        id: uid,
        name,
        email,
        studentId,
        gitHubId,
        leetCodeId,
        role: 'participant',
        gitHubStreak: 0,
        leetCodeStreak: 0,
        totalCodingScore: 0,
        totalDebuggingScore: 0,
        overallRank: allUsers.filter((u) => u.role === 'participant').length + 1,
        isActive: true,
        completedDays: [],
        createdAt: new Date().toISOString(),
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

  const logout = async () => {
    try {
      await signOut(auth);
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      console.error('Password reset failed:', error);
      return { success: false, message: error.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser: state.currentUser,
        loading: state.loading,
        error: state.error,
        login,
        register,
        logout,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
