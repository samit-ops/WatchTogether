import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

/**
 * Firebase Configuration for Mobile SMS Authentication
 * Add your Firebase keys in frontend/.env (e.g. VITE_FIREBASE_API_KEY)
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoFirebaseKeyPlaceholder",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "watch-together.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "watch-together",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "watch-together.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "100000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:100000000000:web:demo123456"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

/**
 * Setup reCAPTCHA verifier for Firebase Phone Auth
 */
export const setupRecaptcha = (containerId = 'recaptcha-container') => {
  try {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        'size': 'invisible',
        'callback': () => {
          console.log('Firebase reCAPTCHA verified');
        }
      });
    }
    return window.recaptchaVerifier;
  } catch (err) {
    console.error('Firebase Recaptcha initialization error:', err);
    return null;
  }
};

/**
 * Sends real SMS OTP to user's mobile phone number via Firebase Authentication
 */
export const sendFirebaseSmsOtp = async (phoneNumber, containerId = 'recaptcha-container') => {
  try {
    const cleanPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber.replace(/\D/g, '')}`;
    const appVerifier = setupRecaptcha(containerId);
    const confirmationResult = await signInWithPhoneNumber(auth, cleanPhone, appVerifier);
    window.confirmationResult = confirmationResult;
    return { success: true, confirmationResult };
  } catch (err) {
    console.error('Firebase SMS Dispatch Error:', err);
    return { success: false, error: err.message };
  }
};
