import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import { getUserProfile, createUserProfile, checkStudentIdExists } from '../services/userService';

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
          const tokenResult = await firebaseUser.getIdTokenResult();
          const isAdminUser = tokenResult.claims.admin === true;
          const profile = await getUserProfile(firebaseUser.uid);
          if (profile) {
            if (profile.isActive === false) {
              await signOut(auth);
              dispatch({ type: 'AUTH_FAIL', payload: 'Your account has been deactivated by the administrator.' });
            } else {
              dispatch({ type: 'AUTH_SUCCESS', payload: { ...profile, isAdmin: isAdminUser } });
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

  const mapFirebaseAuthError = (code) => {
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Invalid email or password.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/network-request-failed':
        return 'Network error. Check your connection.';
      default:
        return 'Login failed. Please try again.';
    }
  };

  const login = async (email, password) => {
    dispatch({ type: 'AUTH_START' });

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const tokenResult = await userCredential.user.getIdTokenResult();
      const isAdminUser = tokenResult.claims.admin === true;
      const profile = await getUserProfile(userCredential.user.uid);

      if (!profile) {
        throw new Error('User profile does not exist in the database.');
      }

      if (profile.isActive === false) {
        await signOut(auth);
        const errMsg = 'Your account has been deactivated by the administrator.';
        dispatch({ type: 'AUTH_FAIL', payload: errMsg });
        return { success: false, message: errMsg };
      }

      dispatch({ type: 'AUTH_SUCCESS', payload: { ...profile, isAdmin: isAdminUser } });
      updateActivity();
      return { success: true, user: { ...profile, isAdmin: isAdminUser } };
    } catch (error) {
      const errMsg = mapFirebaseAuthError(error.code);
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
      // C7: Check studentId uniqueness with a targeted query (reads at most 1 doc)
      const normalizedStudentId = studentId.trim().toUpperCase();
      const studentIdTaken = await checkStudentIdExists(normalizedStudentId);
      if (studentIdTaken) {
        const errMsg = 'Student ID already registered.';
        dispatch({ type: 'AUTH_FAIL', payload: errMsg });
        return { success: false, message: errMsg };
      }

      // Email uniqueness is enforced by Firebase Auth — no manual check needed
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // C5: No role or overallRank — these are system-controlled fields.
      // Absence of role means participant. Admin is via Custom Claims only.
      const newProfile = {
        uid,
        id: uid,
        name,
        email,
        studentId: normalizedStudentId,
        gitHubId,
        leetCodeId,
        gitHubStreak: 0,
        leetCodeStreak: 0,
        totalCodingScore: 0,
        totalDebuggingScore: 0,
        isActive: true,
        completedDays: [],
        createdAt: new Date().toISOString(),
      };

      await createUserProfile(uid, newProfile);
      dispatch({ type: 'AUTH_SUCCESS', payload: { ...newProfile, isAdmin: false } });
      updateActivity();
      return { success: true, user: { ...newProfile, isAdmin: false } };
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
