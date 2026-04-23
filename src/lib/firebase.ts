import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, getDocFromServer, doc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

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
    handleAuthError(error);
  }
};

function handleAuthError(error: any) {
  const errorCode = error.code;
  
  if (errorCode === 'auth/network-request-failed') {
    alert("حدث خطأ في الشبكة (Network Error). يرجى التأكد من:\n1. إيقاف أي مانع إعلانات (AdBlocker) قد يمنع خدمات جوجل.\n2. استخدام متصفح يدعم النوافذ المنبثقة.\n3. الضغط على زر 'فتح التطبيق في نافذة جديدة' أسفل أزرار الدخول.");
  } else if (error.message && error.message.includes('initial state')) {
    alert("عذراً، متصفحك يمنع تسجيل الدخول داخل هذه النافذة. يرجى الضغط على زر 'فتح التطبيق في نافذة جديدة' أسفل أزرار الدخول.");
  } else if (errorCode === 'auth/popup-closed-by-user') {
    // Normal case, user closed the popup
  } else {
    alert(`حدث خطأ أثناء تسجيل الدخول: ${error.message || 'يرجى المحاولة مرة أخرى أو فتح التطبيق في نافذة جديدة.'}`);
  }
}

export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
  }
};

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
