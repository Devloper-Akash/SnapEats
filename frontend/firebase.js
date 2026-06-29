// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "snapeats-food-delivery.firebaseapp.com",
  projectId: "snapeats-food-delivery",
  storageBucket: "snapeats-food-delivery.firebasestorage.app",
  messagingSenderId: "419711316184",
  appId: "1:419711316184:web:ce62da29196be69f7627ad"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export {app,auth};