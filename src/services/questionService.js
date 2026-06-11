// @ts-check
import { db } from '../firebaseConfig';
import { doc, setDoc, deleteDoc, collection, getDocs, onSnapshot } from 'firebase/firestore';
import { error as logError } from '../utils/logger';

const QUESTIONS_COLLECTION = 'questions';

export const getQuestions = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, QUESTIONS_COLLECTION));
    const questions = [];
    querySnapshot.forEach((doc) => {
      questions.push({ id: doc.id, ...doc.data() });
    });
    return questions.sort((a, b) => a.day - b.day);
  } catch (error) {
    logError('Error fetching questions:', error);
    throw error;
  }
};

export const addOrUpdateQuestion = async (dayNum, questionData) => {
  try {
    const docId = `q-${dayNum}`;
    const docRef = doc(db, QUESTIONS_COLLECTION, docId);
    const fullData = {
      id: docId,
      day: Number(dayNum),
      ...questionData,
    };
    await setDoc(docRef, fullData, { merge: true });
    return fullData;
  } catch (error) {
    logError(`Error adding/updating question for Day ${dayNum}:`, error);
    throw error;
  }
};

export const deleteQuestion = async (dayNum) => {
  try {
    const docRef = doc(db, QUESTIONS_COLLECTION, `q-${dayNum}`);
    await deleteDoc(docRef);
  } catch (error) {
    logError(`Error deleting question for Day ${dayNum}:`, error);
    throw error;
  }
};

export const subscribeToQuestions = (callback) => {
  const colRef = collection(db, QUESTIONS_COLLECTION);
  return onSnapshot(colRef, (querySnapshot) => {
    const questions = [];
    querySnapshot.forEach((doc) => {
      questions.push({ id: doc.id, ...doc.data() });
    });
    questions.sort((a, b) => a.day - b.day);
    callback(questions);
  }, (error) => {
    logError('Error subscribing to questions:', error);
  });
};
