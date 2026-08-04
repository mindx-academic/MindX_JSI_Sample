// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDJKEAfDcMG_HAqxTYhnzqam9TVpJ2lmxY",
  authDomain: "mindx-web-intensive.firebaseapp.com",
  projectId: "mindx-web-intensive",
  storageBucket: "mindx-web-intensive.appspot.com",
  messagingSenderId: "328165486013",
  appId: "1:328165486013:web:674f796a1d8b3a38b3b6d4",
  measurementId: "G-F59RRV4K1S",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = firebase.auth();

// Initialize Cloud Firestore and get a reference to the service
const db = firebase.firestore();

// Initialize Cloud Storage and get a reference to the service
const storage = firebase.storage();
