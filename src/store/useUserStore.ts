import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc, collection, query, orderBy } from 'firebase/firestore';

export interface PastLecture {
  id: string;
  title: string;
  summary: string;
  date: number;
  analysis?: any;
}

export type Dialect = 'Iraqi' | 'Moslawi' | 'Egyptian' | 'Maghrebi' | 'Syrian' | 'Gulf' | 'Palestinian' | 'Kurdish' | 'Fusha' | 'English';

export interface UserStats {
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  pastLectures: PastLecture[];
  dialect: Dialect;
  subscription: 'free' | 'paid';
  freeUploadsUsed: number;
}

const DEFAULT_STATS: UserStats = {
  level: 'Beginner',
  pastLectures: [],
  dialect: 'Iraqi',
  subscription: 'free',
  freeUploadsUsed: 0,
};

export function useUserStore(userId?: string) {
  const getStorageKey = (uid?: string) => uid ? `med_student_stats_${uid}` : 'med_student_stats';

  const [stats, setStats] = useState<UserStats>(() => {
    if (typeof window === 'undefined') return DEFAULT_STATS;
    const saved = localStorage.getItem(getStorageKey(userId));
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_STATS, ...parsed };
      } catch (e) {
        console.error('Failed to parse stats from local storage', e);
      }
    }
    return DEFAULT_STATS;
  });

  // Sync from LocalStorage or Firestore
  useEffect(() => {
    if (!userId) {
      const saved = localStorage.getItem(getStorageKey(userId));
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setStats({ ...DEFAULT_STATS, ...parsed });
        } catch (e) {
          setStats(DEFAULT_STATS);
        }
      } else {
        setStats(DEFAULT_STATS);
      }
      return;
    }

    // If userId exists, subscribe to Firestore
    const userRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as any;
        setStats(prev => ({
          ...prev,
          level: data.level || DEFAULT_STATS.level,
          dialect: data.dialect || DEFAULT_STATS.dialect,
          subscription: data.subscription || DEFAULT_STATS.subscription,
          freeUploadsUsed: data.freeUploadsUsed || 0,
        }));
      }
    });

    return () => unsubscribe();
  }, [userId]);

  // Sync Past Lectures (from subcollection)
  useEffect(() => {
    if (!userId) return;

    const lecturesRef = collection(db, 'users', userId, 'lectures');
    const q = query(lecturesRef, orderBy('date', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const lectures: PastLecture[] = [];
      snap.forEach(doc => lectures.push(doc.data() as PastLecture));
      if (lectures.length > 0) {
        setStats(prev => ({ ...prev, pastLectures: lectures }));
      }
    });

    return () => unsubscribe();
  }, [userId]);

  const saveStats = async (newStats: UserStats) => {
    setStats(newStats);
    
    // Save to LocalStorage
    try {
      localStorage.setItem(getStorageKey(userId), JSON.stringify(newStats));
    } catch (e) {
      console.warn('Failed to save to local storage', e);
    }

    // Save to Firestore if logged in
    if (userId) {
      try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
          level: newStats.level,
          dialect: newStats.dialect,
          subscription: newStats.subscription,
          freeUploadsUsed: newStats.freeUploadsUsed,
          uid: userId
        }, { merge: true });
        
        // Also sync public profile
        const publicRef = doc(db, 'public_profiles', userId);
        await setDoc(publicRef, {
          uid: userId,
          level: newStats.level
        }, { merge: true });
      } catch (e) {
        console.error('Error syncing to firestore', e);
      }
    }
  };

  const addPastLecture = async (lecture: PastLecture) => {
    const newLectures = [lecture, ...(Array.isArray(stats.pastLectures) ? stats.pastLectures : [])];
    const newStats = { ...stats, pastLectures: newLectures };
    
    setStats(newStats);
    localStorage.setItem(getStorageKey(userId), JSON.stringify(newStats));

    if (userId) {
      try {
        const lectureRef = doc(db, 'users', userId, 'lectures', lecture.id);
        await setDoc(lectureRef, lecture);
      } catch (e) {
        console.error('Error saving lecture to firestore', e);
      }
    }
  };

  const setDialect = (dialect: Dialect) => {
    saveStats({ ...stats, dialect });
  };

  const incrementFreeUploads = () => {
    saveStats({ ...stats, freeUploadsUsed: (stats.freeUploadsUsed || 0) + 1 });
  };

  const upgradeSubscription = () => {
    saveStats({ ...stats, subscription: 'paid' });
  };

  return { stats, addPastLecture, setDialect, incrementFreeUploads, upgradeSubscription };
}
