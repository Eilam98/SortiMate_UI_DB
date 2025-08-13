import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBKRSZOGEyYLcmAVEVb26nJs-9FTZfYZEQ",
  authDomain: "sortimate0.firebaseapp.com",
  projectId: "sortimate0",
  storageBucket: "sortimate0.firebasestorage.app",
  messagingSenderId: "673761246323",
  appId: "1:673761246323:web:abe937aefbb92e7ffe3e06",
  measurementId: "G-3MDT9XX5VJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); 