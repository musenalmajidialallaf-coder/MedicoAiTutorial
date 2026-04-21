import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, getDocFromServer, doc } from 'firebase/firestore';
// Manual config for absolute reliability with custom domains
const firebaseConfig = {
  projectId: "ai-studio-applet-webapp-1d4ad",
  appId: "1:199134510481:web:930360d61e64f784e32e30",
  apiKey: "AIzaSyAcXiHnfx7hLQZtc6cvy27KrgE8YgaIDss",
  authDomain: "ai-studio-applet-webapp-1d4ad.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-d69f661d-81ae-47e4-9e62-b0ab245d7dc3",
  storageBucket: "ai-studio-applet-webapp-1d4ad.firebasestorage.app",
  messagingSenderId: "199134510481"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

// Improved connection testing with clearer logs
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'system', 'ping'));
    console.log("Firebase Connectivity: Verified (Project: ai-studio-applet-webapp-1d4ad)");
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      console.log("Firebase Connectivity: Verified (Access restricted by rules - OK)");
    } else {
      console.warn("Firestore Connectivity Check:", error.message);
    }
  }
}
testConnection();

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
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
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
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const signInWithGoogle = async (promptSelectAccount = false) => {
  try {
    const provider = new GoogleAuthProvider();
    if (promptSelectAccount) {
      provider.setCustomParameters({
        prompt: 'select_account'
      });
    }
    await signInWithPopup(auth, provider);
  } catch (error: any) {
    console.error("Error signing in with Google", error);
    if (error.message && error.message.includes('initial state')) {
      alert("عذراً، متصفحك يمنع تسجيل الدخول داخل هذه النافذة. يرجى الضغط على زر 'فتح التطبيق في نافذة جديدة' الموجود أسفل زر تسجيل الدخول.");
    } else {
      alert("حدث خطأ أثناء تسجيل الدخول. يرجى التأكد من تفعيل النوافذ المنبثقة (Pop-ups) أو فتح التطبيق في نافذة جديدة.");
    }
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
  }
};
