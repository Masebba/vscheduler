// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, query, where } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDXDK_4qx2SCJDAATbiyPB-Eb9zieM01-c",
  authDomain: "vscheduler-924b8.firebaseapp.com",
  projectId: "vscheduler-924b8",
  storageBucket: "vscheduler-924b8.firebasestorage.app",
  messagingSenderId: "59519215798",
  appId: "1:59519215798:web:a14a355914dbe28ce35e17"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export { collection, addDoc, getDocs, query, where };

export default app;