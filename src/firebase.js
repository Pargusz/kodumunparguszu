// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyABGL0QtLJRpCOxgJToZeOoTLndb8A15ZE",
    authDomain: "kodumunparguszu.firebaseapp.com",
    databaseURL: "https://kodumunparguszu-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "kodumunparguszu",
    storageBucket: "kodumunparguszu.firebasestorage.app",
    messagingSenderId: "296466149590",
    appId: "1:296466149590:web:3deead1c371105c028d977",
    measurementId: "G-8DZ233FNS1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
