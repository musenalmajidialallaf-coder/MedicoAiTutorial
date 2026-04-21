import { useState, useEffect } from 'react';

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

  useEffect(() => {
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
  }, [userId]);

  useEffect(() => {
    try {
      localStorage.setItem(getStorageKey(userId), JSON.stringify(stats));
    } catch (e) {
      console.warn('Failed to save stats to local storage', e);
    }
  }, [stats, userId]);

  const addPastLecture = (lecture: PastLecture) => {
    setStats((prev) => ({
      ...prev,
      pastLectures: [lecture, ...(Array.isArray(prev.pastLectures) ? prev.pastLectures : [])],
    }));
  };

  const setDialect = (dialect: Dialect) => {
    setStats((prev) => ({ ...prev, dialect }));
  };

  const incrementFreeUploads = () => {
    setStats((prev) => ({ ...prev, freeUploadsUsed: (prev.freeUploadsUsed || 0) + 1 }));
  };

  const upgradeSubscription = () => {
    setStats((prev) => ({ ...prev, subscription: 'paid' }));
  };

  return { stats, addPastLecture, setDialect, incrementFreeUploads, upgradeSubscription };
}
