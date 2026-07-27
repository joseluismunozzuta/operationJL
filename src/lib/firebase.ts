"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Config pública del SDK web de Firebase — no es secreta, la protegen las
// reglas de Firestore, no el secreto de estos valores.
const firebaseConfig = {
  apiKey: "AIzaSyAhqJCPlng-IsoFtHEt81ZNxZBu-7Iwasg",
  authDomain: "operationjl.firebaseapp.com",
  projectId: "operationjl",
  storageBucket: "operationjl.firebasestorage.app",
  messagingSenderId: "594888909646",
  appId: "1:594888909646:web:96949026eda5a21549b41f",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// signInWithPopup (no signInWithRedirect) abre una ventana emergente para el
// login de Google y resuelve ahí mismo — la página principal nunca navega ni
// se recarga. onAuthStateChanged notifica el cambio cuando el popup cierra.
export function signInWithGoogle() {
  return signInWithPopup(auth, new GoogleAuthProvider());
}

export function signOutUser() {
  return signOut(auth);
}
