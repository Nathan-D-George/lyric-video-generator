import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCC8gQ3PIxn3p5agySXOi1B7_4N82cRwpQ",
  authDomain: "lyric-studio-workbench.firebaseapp.com",
  projectId: "lyric-studio-workbench",
  storageBucket: "lyric-studio-workbench.firebasestorage.app",
  messagingSenderId: "107848033634",
  appId: "1:107848033634:web:1b78cee2c9817ccf92f83b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
