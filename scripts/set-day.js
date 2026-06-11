import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyArJeK7WRkzECH2ZVCYYwDk2Ct-Q1Q3iyQ",
  authDomain: "acm-100doc-platform.firebaseapp.com",
  projectId: "acm-100doc-platform",
  storageBucket: "acm-100doc-platform.firebasestorage.app",
  messagingSenderId: "918958640481",
  appId: "1:918958640481:web:3fd68068752b4f66b70920"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const day = parseInt(process.argv[2]) || 9;

async function setDay() {
  try {
    await setDoc(doc(db, 'system', 'config'), {
      currentDay: day,
      lastDayAdvanceTime: new Date(),
    }, { merge: true });
    console.log(`✓ Set currentDay to ${day}`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

setDay();