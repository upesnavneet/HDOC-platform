import { db } from '../firebaseConfig';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, onSnapshot } from 'firebase/firestore';

const USERS_COLLECTION = 'users';

export const getUserProfile = async (uid) => {
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const createUserProfile = async (uid, userData) => {
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    await setDoc(docRef, userData);
    return { id: uid, ...userData };
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (uid, updateData) => {
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating user profile:', error);
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
    console.error('Error getting all users:', error);
    throw error;
  }
};

export const subscribeToUsers = (callback) => {
  const colRef = collection(db, USERS_COLLECTION);
  return onSnapshot(colRef, (querySnapshot) => {
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    callback(users);
  }, (error) => {
    console.error('Error subscribing to users:', error);
  });
};
