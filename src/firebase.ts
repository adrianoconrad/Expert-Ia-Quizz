import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, onSnapshot, Timestamp, getDocFromServer, deleteDoc, writeBatch, updateDoc, limit, enableIndexedDbPersistence } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
// Use the firestoreDatabaseId from the config if it exists
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId || '(default)');
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab at a time.
    console.warn('Firestore persistence failed: Multiple tabs open');
  } else if (err.code === 'unimplemented') {
    // The current browser does not support all of the features required to enable persistence
    console.warn('Firestore persistence failed: Browser not supported');
  }
});

// Auth Helpers
export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);

// Firestore Error Handling Spec
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorCode = (error as any)?.code;
  
  const isQuotaExceeded = 
    errorMessage.includes('resource-exhausted') || 
    errorMessage.includes('Quota exceeded') || 
    errorCode === 'resource-exhausted';

  const isUnavailable = 
    errorCode === 'unavailable' || 
    errorMessage.includes('Could not reach Cloud Firestore backend');
  
  const errInfo: FirestoreErrorInfo = {
    error: isQuotaExceeded 
      ? 'Limite de uso diário do banco de dados atingido (Quota Exceeded). O Experte IA atingiu o limite gratuito de leitura/escrita do Firebase por hoje. O acesso será restaurado automaticamente amanhã.' 
      : isUnavailable 
        ? 'O Experte IA está operando em Modo Offline. Não foi possível conectar ao servidor do Firebase. Verifique sua conexão ou tente novamente mais tarde.'
        : errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  
  if (isQuotaExceeded || isUnavailable) {
    if (isQuotaExceeded) {
      console.warn('Firestore Quota Exceeded Detected:', operationType, path);
    } else {
      console.warn('Firestore is Offline/Unavailable:', operationType, path);
    }
    // Don't re-throw if it's a quota or connectivity error to avoid "Uncaught Error" logs
    // The UI should handle the firestoreQuotaExceeded/firestoreUnavailable state instead
    return; 
  } else {
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  }
}

// Connection Test
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

export { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  Timestamp,
  deleteDoc,
  writeBatch,
  updateDoc,
  limit
};
export { onAuthStateChanged };
