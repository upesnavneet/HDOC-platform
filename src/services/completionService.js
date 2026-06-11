import { db } from '../firebaseConfig';
import { doc, setDoc, updateDoc, collection, getDocs, onSnapshot, getDoc } from 'firebase/firestore';

const SUBMISSIONS_COLLECTION = 'submissions';
const DEBUGGING_CHALLENGES_COLLECTION = 'debuggingChallenges';
const DEBUGGING_SUBMISSIONS_COLLECTION = 'debuggingSubmissions';
const SYSTEM_COLLECTION = 'system';
const CONFIG_DOC = 'config';

// --- Daily Challenges Submissions ---
export const getSubmissions = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, SUBMISSIONS_COLLECTION));
    const subs = [];
    querySnapshot.forEach((doc) => {
      subs.push({ id: doc.id, ...doc.data() });
    });
    return subs;
  } catch (error) {
    console.error('Error fetching submissions:', error);
    throw error;
  }
};

export const addOrUpdateSubmission = async (subId, subData) => {
  try {
    const docRef = doc(db, SUBMISSIONS_COLLECTION, subId);
    const fullData = { id: subId, ...subData };
    await setDoc(docRef, fullData, { merge: true });
    return fullData;
  } catch (error) {
    console.error('Error adding/updating submission:', error);
    throw error;
  }
};

export const subscribeToSubmissions = (callback) => {
  const colRef = collection(db, SUBMISSIONS_COLLECTION);
  return onSnapshot(colRef, (querySnapshot) => {
    const subs = [];
    querySnapshot.forEach((doc) => {
      subs.push({ id: doc.id, ...doc.data() });
    });
    callback(subs);
  }, (error) => {
    console.error('Error subscribing to submissions:', error);
  });
};

// --- Sunday Debugging Challenges ---
export const getDebuggingChallenges = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, DEBUGGING_CHALLENGES_COLLECTION));
    const challenges = [];
    querySnapshot.forEach((doc) => {
      challenges.push({ id: doc.id, ...doc.data() });
    });
    return challenges.sort((a, b) => a.week - b.week);
  } catch (error) {
    console.error('Error fetching debugging challenges:', error);
    throw error;
  }
};

export const addOrUpdateDebuggingChallenge = async (weekNum, challengeData) => {
  try {
    const docId = `week-${weekNum}`;
    const docRef = doc(db, DEBUGGING_CHALLENGES_COLLECTION, docId);
    const fullData = {
      id: docId,
      week: Number(weekNum),
      ...challengeData,
    };
    await setDoc(docRef, fullData, { merge: true });
    return fullData;
  } catch (error) {
    console.error('Error adding/updating debugging challenge:', error);
    throw error;
  }
};

export const subscribeToDebuggingChallenges = (callback) => {
  const colRef = collection(db, DEBUGGING_CHALLENGES_COLLECTION);
  return onSnapshot(colRef, (querySnapshot) => {
    const challenges = [];
    querySnapshot.forEach((doc) => {
      challenges.push({ id: doc.id, ...doc.data() });
    });
    challenges.sort((a, b) => a.week - b.week);
    callback(challenges);
  }, (error) => {
    console.error('Error subscribing to debugging challenges:', error);
  });
};

// --- Sunday Debugging Submissions ---
export const submitDebuggingSolution = async (challengeId, userId, link, timestamp) => {
  try {
    const docId = `debug-sub-${challengeId}-${userId}`;
    const docRef = doc(db, DEBUGGING_SUBMISSIONS_COLLECTION, docId);
    const fullData = {
      id: docId,
      challengeId,
      userId,
      link,
      timestamp,
      score: null, // Initial score pending
    };
    await setDoc(docRef, fullData, { merge: true });
    return fullData;
  } catch (error) {
    console.error('Error submitting debugging solution:', error);
    throw error;
  }
};

export const gradeDebuggingSolution = async (challengeId, userId, score) => {
  try {
    const docId = `debug-sub-${challengeId}-${userId}`;
    const docRef = doc(db, DEBUGGING_SUBMISSIONS_COLLECTION, docId);
    await updateDoc(docRef, { score: Number(score) });
  } catch (error) {
    console.error('Error grading debugging solution:', error);
    throw error;
  }
};

export const subscribeToDebuggingSubmissions = (callback) => {
  const colRef = collection(db, DEBUGGING_SUBMISSIONS_COLLECTION);
  return onSnapshot(colRef, (querySnapshot) => {
    const subs = [];
    querySnapshot.forEach((doc) => {
      subs.push({ id: doc.id, ...doc.data() });
    });
    callback(subs);
  }, (error) => {
    console.error('Error subscribing to debugging submissions:', error);
  });
};

// --- System Configuration (Time Travel Clock) ---
export const getSystemConfig = async () => {
  try {
    const docRef = doc(db, SYSTEM_COLLECTION, CONFIG_DOC);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error('Error fetching system config:', error);
    throw error;
  }
};

export const updateSystemConfig = async (configData) => {
  try {
    const docRef = doc(db, SYSTEM_COLLECTION, CONFIG_DOC);
    await setDoc(docRef, configData, { merge: true });
  } catch (error) {
    console.error('Error updating system config:', error);
    throw error;
  }
};

// Auto-advance day after 24 hours
export const checkAndAutoAdvanceDay = async () => {
  try {
    const config = await getSystemConfig();
    if (!config) return null;

    const now = new Date();
    const lastAdvance = config.lastDayAdvanceTime?.toDate?.() || new Date(config.lastDayAdvanceTime);
    const hoursSinceLastAdvance = (now - lastAdvance) / (1000 * 60 * 60);

    // If 24 hours have passed, advance the day
    if (hoursSinceLastAdvance >= 24) {
      const newDay = (config.currentDay || 1) + 1;
      await updateSystemConfig({
        currentDay: newDay,
        lastDayAdvanceTime: now,
        completedWeeks: config.completedWeeks,
      });
      console.log(`Auto-advanced to Day ${newDay}`);
      return newDay;
    }

    return null;
  } catch (error) {
    console.error('Error checking auto-advance:', error);
    return null;
  }
};

export const subscribeToSystemConfig = (callback) => {
  const docRef = doc(db, SYSTEM_COLLECTION, CONFIG_DOC);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error subscribing to system config:', error);
  });
};
