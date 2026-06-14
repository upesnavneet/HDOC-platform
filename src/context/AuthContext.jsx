import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { error as logError } from '../utils/logger';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import { getUserProfile, createUserProfile, checkStudentIdExists, checkDuplicateField } from '../services/userService';

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
          const profile = await getUserProfile(firebaseUser.uid);
          if (profile) {
            if (profile.isActive === false) {
              await signOut(auth);
              dispatch({
                type: 'AUTH_FAIL',
                payload: 'Your account has been deactivated by the administrator.',
              });
            } else {
              // Accept admin via JWT Custom Claim OR Firestore isAdminAccount flag.
              // Custom Claims require a server-side Admin SDK — since this app has no
              // backend, isAdminAccount in Firestore is the authoritative admin gate.
              const isAdminUser =
                tokenResult.claims.admin === true || profile.isAdminAccount === true;
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
      case 'auth/email-already-in-use':
        return 'This email address is already registered.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-not-found':
        return 'No account found with this username or email.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/invalid-credential':
        return "The account doesn't exist or wrong credentials.";
      case 'auth/weak-password':
        return 'Password is too weak. Please choose a stronger password.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please wait and try again.';
      case 'auth/user-disabled':
        return 'Your account has been temporarily disabled. Contact support.';
      case 'auth/network-request-failed':
        return 'Unable to connect to the server. Please check your internet connection.';
      case 'auth/internal-error':
        return 'Server error. Please try again later.';
      default:
        return 'An error occurred. Please try again.';
    }
  };

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const tokenResult = await userCredential.user.getIdTokenResult();
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

      // Accept admin via JWT Custom Claim OR Firestore isAdminAccount flag.
      // Custom Claims require a server-side Admin SDK — since this app has no
      // backend, isAdminAccount in Firestore is the authoritative admin gate.
      const isAdminUser =
        tokenResult.claims.admin === true || profile.isAdminAccount === true;

      dispatch({ type: 'AUTH_SUCCESS', payload: { ...profile, isAdmin: isAdminUser } });
      updateActivity();
      return { success: true, user: { ...profile, isAdmin: isAdminUser } };
    } catch (error) {
      const errMsg = mapFirebaseAuthError(error.code);
      dispatch({ type: 'AUTH_FAIL', payload: errMsg });
      return { success: false, message: errMsg };
    }
  };

  const register = async (name, email, password, studentId, gitHubId, leetCodeId, hackerRankId) => {
    if (!validatePassword(password)) {
      const errMsg =
        'Password must be at least 8 characters long, contain at least 1 number, and 1 special character.';
      dispatch({ type: 'AUTH_FAIL', payload: errMsg });
      return { success: false, message: errMsg };
    }

    try {
      // Email uniqueness is enforced by Firebase Auth — no manual check needed
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Check studentId uniqueness
      const normalizedStudentId = studentId.trim().toUpperCase();
      const studentIdTaken = await checkStudentIdExists(normalizedStudentId);
      if (studentIdTaken) {
        await userCredential.user.delete();
        const errMsg = 'Student ID already registered.';
        dispatch({ type: 'AUTH_FAIL', payload: errMsg });
        return { success: false, message: errMsg };
      }

      // Check duplicate usernames
      const gitHubTaken = await checkDuplicateField('gitHubId', gitHubId.trim());
      if (gitHubTaken) {
        await userCredential.user.delete();
        const errMsg = 'GitHub username already registered.';
        dispatch({ type: 'AUTH_FAIL', payload: errMsg });
        return { success: false, message: errMsg };
      }

      const leetCodeTaken = await checkDuplicateField('leetCodeId', leetCodeId.trim());
      if (leetCodeTaken) {
        await userCredential.user.delete();
        const errMsg = 'LeetCode username already registered.';
        dispatch({ type: 'AUTH_FAIL', payload: errMsg });
        return { success: false, message: errMsg };
      }

      const hackerRankTaken = await checkDuplicateField('hackerRankId', hackerRankId?.trim());
      if (hackerRankTaken) {
        await userCredential.user.delete();
        const errMsg = 'HackerRank username already registered.';
        dispatch({ type: 'AUTH_FAIL', payload: errMsg });
        return { success: false, message: errMsg };
      }

      // C5: No role or overallRank — these are system-controlled fields.
      // Absence of role means participant. Admin is via Custom Claims only.
      const newProfile = {
        uid,
        id: uid,
        name,
        email,
        studentId: normalizedStudentId,
        gitHubId: gitHubId.trim(),
        leetCodeId: leetCodeId.trim(),
        hackerRankId: hackerRankId ? hackerRankId.trim() : '',
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
      logError('Registration failed:', error);
      const errMsg = error.code ? mapFirebaseAuthError(error.code) : 'Registration failed. Please try again.';
      dispatch({ type: 'AUTH_FAIL', payload: errMsg });
      return { success: false, message: errMsg };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      logError('Logout failed:', error);
    }
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      logError('Password reset failed:', error);
      const errMsg = error.code ? mapFirebaseAuthError(error.code) : 'Password reset failed. Please try again.';
      return { success: false, message: errMsg };
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
