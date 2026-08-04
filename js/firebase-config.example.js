// B4 LAYER: Firebase Config Template
// COPY FILE NÀY THÀNH firebase-config.js VÀ ĐIỀN THÔNG TIN THẬT
// KHÔNG ĐƯỢC COMMIT FILE firebase-config.js LÊN GITHUB

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
