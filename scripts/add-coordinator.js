import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

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
const auth = getAuth(app);

const email = process.argv[2] || 'kumarnavneet7765@gmail.com';
const password = process.argv[3] || 'krish1945';

async function addCoordinatorRole() {
  try {
    console.log('Signing in as', email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    console.log('User UID:', uid);
    console.log('Adding coordinator role...');

    await setDoc(doc(db, 'users', uid), { role: 'coordinator' }, { merge: true });

    console.log('✓ Successfully added coordinator role!');
    console.log('UID:', uid);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

addCoordinatorRole();