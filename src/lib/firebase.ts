import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, getDocFromServer, doc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

// Improved connection testing
async function testConnection() {
  try {
    // Attempt a read on a path that likely doesn't exist to test connectivity
    // Permission denied is a SUCCESSFUL connect (rules are working)
    // "Client is offline" or "Failed to get document" is a FAIL.
    await getDocFromServer(doc(db, 'system', 'ping'));
    console.log("Firebase Connectivity: Verified");
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      console.log("Firebase Connectivity: Verified (Access restricted by rules as expected)");
    } else if (error.message && error.message.includes('the client is offline')) {
      console.warn("Firestore Connectivity: Client appears to be offline. This might be a temporary network issue or invalid configuration.");
    } else {
      console.debug("Firestore connectivity check info:", error.message);
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
