// FIREBASE CONFIGURATION (JSI Firebase Test Project)
const firebaseConfig = {
  apiKey: "AIzaSyCzO4y67_zpdAIBF6Bxw_jDV10q6ZCPVkk",
  authDomain: "mindx-jsi-b6-tmp-20260804.firebaseapp.com",
  projectId: "mindx-jsi-b6-tmp-20260804",
  storageBucket: "mindx-jsi-b6-tmp-20260804.firebasestorage.app",
  messagingSenderId: "392964400437",
  appId: "1:392964400437:web:163f7ba3c5c759474d187c"
};

// Initialize Firebase
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Expose the single Firestore instance consumed by the derived V1 data layer.
if (typeof firebase !== 'undefined' && firebase.apps.length && firebase.firestore) {
  window.db = firebase.firestore();
}
