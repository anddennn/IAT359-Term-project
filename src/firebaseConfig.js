// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import * as FirebaseAuth from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBRum2tEthGDLV1IqDId6SzaEexZnFn6F4",
  authDomain: "iat359termproject.firebaseapp.com",
  projectId: "iat359termproject",
  storageBucket: "iat359termproject.firebasestorage.app",
  messagingSenderId: "150881247679",
  appId: "1:150881247679:web:341194f61e68a6be51810a",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth =
  Platform.OS === "web"
    ? FirebaseAuth.getAuth(app)
    : FirebaseAuth.initializeAuth(app, {
        persistence: FirebaseAuth.getReactNativePersistence(
          ReactNativeAsyncStorage,
        ),
      });
// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app); // Exported db to use in other screens
