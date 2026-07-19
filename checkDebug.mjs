import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import dotenv from 'dotenv';
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  const usersSnap = await getDocs(collection(db, 'users'));
  let userId = null;
  usersSnap.forEach(d => {
    if (d.data().gitHubId === 'upesnavneet' || d.id === 'upesnavneet') {
      userId = d.id;
    }
  });

  console.log('userId:', userId);

  const challengesSnap = await getDocs(collection(db, 'debuggingChallenges'));
  challengesSnap.forEach(c => {
    console.log('Challenge:', c.id, 'Week:', c.data().week);
  });

  const subsSnap = await getDocs(collection(db, 'debuggingSubmissions'));
  const userDebugSubs = [];
  subsSnap.forEach(s => {
    if (s.data().userId === userId) {
      userDebugSubs.push({ id: s.id, ...s.data() });
    }
  });
  console.log('User Debug Subs:', JSON.stringify(userDebugSubs, null, 2));

  setTimeout(() => process.exit(0), 1000);
}
main().catch(console.error);
