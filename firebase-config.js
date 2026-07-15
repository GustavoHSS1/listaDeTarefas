import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { getMessaging } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-messaging.js";

const firebaseConfig = {
    apiKey: "AIzaSyB1VuM8VTwglUL-KK_YfqQgI03IjoPAIpw",
    authDomain: "minha-agenda-713.firebaseapp.com",
    projectId: "minha-agenda-713",
    storageBucket: "minha-agenda-713.firebasestorage.app",
    messagingSenderId: "707157289905",
    appId: "1:707157289905:web:bb1a8114c1e09f91b1ab90"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const messaging = getMessaging(app);