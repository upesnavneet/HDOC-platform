// @ts-check
import { db } from '../firebaseConfig';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { error as logError } from '../utils/logger';

/**
 * @typedef {Object} UserProfile
 * @property {string} id
 * @property {string} uid
 * @property {string} name
 * @property {string} email
 * @property {string} studentId
 * @property {string} gitHubId
 * @property {string} leetCodeId
 * @property {number} gitHubStreak
 * @property {number} leetCodeStreak
 * @property {number} totalCodingScore
 * @property {number} totalDebuggingScore
 * @property {boolean} isActive
 * @property {number[]} completedDays
 * @property {string} createdAt
 * @property {boolean} [isAdmin]
 * @property {number} [overallRank]
 */

const USERS_COLLECTION = 'users';

/**
 * @param {string} uid
 * @returns {Promise<UserProfile|null>}
 */
export const getUserProfile = async (uid) => {
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    logError('Error fetching user profile:', error);
    throw error;
  }
};

export const createUserProfile = async (uid, userData) => {
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    await setDoc(docRef, userData);
    return { id: uid, ...userData };
  } catch (error) {
    logError('Error creating user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (uid, updateData) => {
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(docRef, updateData);
  } catch (error) {
    logError('Error updating user profile:', error);
    throw error;
  }
};

export const getAllUsers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    return users;
  } catch (error) {
    logError('Error getting all users:', error);
    throw error;
  }
};

/**
 * Check if a studentId already exists in the users collection.
 * Uses a targeted query (reads at most 1 document) instead of fetching all users.
 */
export const checkStudentIdExists = async (studentId) => {
  try {
    const q = query(
      collection(db, USERS_COLLECTION),
      where('studentId', '==', studentId),
      limit(1)
    );
    const snap = await getDocs(q);
    return !snap.empty;
  } catch (error) {
    logError('Error checking student ID:', error);
    throw error;
  }
};

export const subscribeToUsers = (callback, onError) => {
  const colRef = collection(db, USERS_COLLECTION);
  return onSnapshot(
    colRef,
    (querySnapshot) => {
      const users = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });
      callback(users);
    },
    (error) => {
      logError('Error subscribing to users:', error);
      onError?.(error);
    }
  );
};
