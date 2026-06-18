// -----------------------------------------------------------------------------
// AuthContext.jsx — mock authentication + reader management.
//
// ⚠️ This is a CLIENT-ONLY MOCK so the app flow works end to end without a
// backend. "Logging in" with any email/password succeeds; sessions are kept in
// localStorage. Replace login()/signup() with real API calls when ready — the
// component API (useAuth) can stay the same.
// -----------------------------------------------------------------------------
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

import { SEED_READERS, freshStats } from "../data.app.js";

import { todayKey } from "../access.js";

// Empty progress map for a brand-new reader. Shape:
//   stories/courses: { [contentId]: { completed:{[chId]:true}, page:{[chId]:n},
//                                     lastChapterId, updatedAt } }
//   activity: { minutesByDate:{[date]:min}, activeDates:{[date]:true}, lastActiveDate }
const freshProgress = () => ({
  stories: {},
  courses: {},
  activity: { minutesByDate: {}, activeDates: {}, lastActiveDate: null },
});

// Guarantee a reader has a well-formed progress object (covers older saves).
const withProgress = (r) => ({
  ...r,
  progress: {
    stories: r?.progress?.stories || {},
    courses: r?.progress?.courses || {},
    activity: {
      minutesByDate: r?.progress?.activity?.minutesByDate || {},
      activeDates: r?.progress?.activity?.activeDates || {},
      lastActiveDate: r?.progress?.activity?.lastActiveDate || null,
    },
  },
});

const DB_KEY = "pedagogy.db.v1"; // { [email]: account }
const CUR_KEY = "pedagogy.current.v1"; // email of the signed-in account

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

// --- localStorage helpers (guarded so SSR / private mode never crash) --------
const readJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const writeJSON = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    /* storage full or unavailable — ignore in this mock */
  }
};

const newId = (p = "rdr") => `${p}_${Math.random().toString(36).slice(2, 9)}`;

// Build a brand-new account object from signup details.
const makeAccount = ({
  name,
  email,
  avatar = "🦉",
  firstReader,
  seed = false,
}) => {
  const readers = [];
  if (firstReader) {
    readers.push({
      id: newId(),
      name: firstReader.name,
      emoji: firstReader.emoji || "🐻",
      color: firstReader.color || "grape",
      age: firstReader.age ?? 5,
      level: firstReader.level || "explorer",
      stats: freshStats(),
      progress: freshProgress(),
    });
  }
  if (seed) readers.push(...SEED_READERS.map((r) => withProgress({ ...r })));
  return {
    user: { name: name || "Friend", email, avatar, plan: "Free" },
    readers,
    activeReaderId: readers[0]?.id || null,
  };
};

export function AuthProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [ready, setReady] = useState(false);

  // Restore session on first mount.
  useEffect(() => {
    const email = readJSON(CUR_KEY, null);
    const db = readJSON(DB_KEY, {});
    if (email && db[email]) {
      const a = db[email];
      // Migrate older saves so every reader has a progress object.
      setAccount({ ...a, readers: (a.readers || []).map(withProgress) });
    }
    setReady(true);
  }, []);

  // Persist the active account back into the db whenever it changes.
  useEffect(() => {
    if (!account) return;
    const db = readJSON(DB_KEY, {});
    db[account.user.email] = account;
    writeJSON(DB_KEY, db);
    writeJSON(CUR_KEY, account.user.email);
  }, [account]);

  // --- auth actions ----------------------------------------------------------
  const login = useCallback(({ email, name }) => {
    const db = readJSON(DB_KEY, {});
    const existing = db[email];
    // Returning account → restore it. New email → spin up a demo account with
    // sample readers so the dashboard has something to show.
    const next = existing || makeAccount({ name, email, seed: true });
    setAccount(next);
    return next;
  }, []);

  const signup = useCallback(({ name, email, firstReader }) => {
    const next = makeAccount({ name, email, firstReader, seed: false });
    setAccount(next);
    return next;
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(CUR_KEY);
    } catch {
      /* ignore */
    }
    setAccount(null);
  }, []);

  // --- account + reader mutations -------------------------------------------
  const updateAccount = useCallback((patch) => {
    setAccount((a) => (a ? { ...a, user: { ...a.user, ...patch } } : a));
  }, []);

  const addReader = useCallback((reader) => {
    let id = null;
    setAccount((a) => {
      if (!a) return a;
      id = newId();
      const r = {
        id,
        name: reader.name?.trim() || "New reader",
        emoji: reader.emoji || "🐻",
        color: reader.color || "grape",
        age: reader.age ?? 5,
        level: reader.level || "explorer",
        stats: freshStats(),
        progress: freshProgress(),
      };
      const readers = [...a.readers, r];
      return { ...a, readers, activeReaderId: a.activeReaderId || id };
    });
    return id;
  }, []);

  const updateReader = useCallback((id, patch) => {
    setAccount((a) =>
      a
        ? {
            ...a,
            readers: a.readers.map((r) =>
              r.id === id ? { ...r, ...patch } : r,
            ),
          }
        : a,
    );
  }, []);

  const removeReader = useCallback((id) => {
    setAccount((a) => {
      if (!a) return a;
      const readers = a.readers.filter((r) => r.id !== id);
      const activeReaderId =
        a.activeReaderId === id ? readers[0]?.id || null : a.activeReaderId;
      return { ...a, readers, activeReaderId };
    });
  }, []);

  const setActiveReader = useCallback((id) => {
    setAccount((a) => (a ? { ...a, activeReaderId: id } : a));
  }, []);

  // --- reading progress (per active reader, persisted via the account) -------
  // Apply a transform to the active reader (always with a normalized progress).
  const updateActiveReader = useCallback((fn) => {
    setAccount((a) => {
      if (!a) return a;
      const readers = a.readers.map((r) =>
        r.id === a.activeReaderId ? fn(withProgress(r)) : r,
      );
      return { ...a, readers };
    });
  }, []);

  const markActive = (activity) => {
    const today = todayKey();
    return {
      ...activity,
      activeDates: { ...activity.activeDates, [today]: true },
      lastActiveDate: today,
    };
  };

  // Mark a chapter/lesson finished + log today as an active reading day.
  const markChapterRead = useCallback(
    (kind, contentId, chapterId) => {
      const key = String(chapterId);
      const bucket = kind === "lesson" ? "courses" : "stories";
      updateActiveReader((r) => {
        const prog = r.progress;
        const entry = prog[bucket][contentId] || { completed: {}, page: {} };
        return {
          ...r,
          progress: {
            ...prog,
            [bucket]: {
              ...prog[bucket],
              [contentId]: {
                ...entry,
                completed: { ...entry.completed, [key]: true },
                lastChapterId: key,
                updatedAt: Date.now(),
              },
            },
            activity: markActive(prog.activity),
          },
        };
      });
    },
    [updateActiveReader],
  );

  // Add reading time (seconds) to today's tally — powers minutes + the week chart.
  const recordReading = useCallback(
    (seconds = 0) => {
      if (!seconds || seconds < 0) return;
      const today = todayKey();
      updateActiveReader((r) => {
        const a = r.progress.activity;
        return {
          ...r,
          progress: {
            ...r.progress,
            activity: {
              ...markActive(a),
              minutesByDate: {
                ...a.minutesByDate,
                [today]: (a.minutesByDate[today] || 0) + seconds / 60,
              },
            },
          },
        };
      });
    },
    [updateActiveReader],
  );

  // Remember the current page so the reader can resume later.
  const saveReadingPosition = useCallback(
    (kind, contentId, chapterId, page) => {
      const key = String(chapterId);
      const bucket = kind === "lesson" ? "courses" : "stories";
      updateActiveReader((r) => {
        const prog = r.progress;
        const entry = prog[bucket][contentId] || { completed: {}, page: {} };
        return {
          ...r,
          progress: {
            ...prog,
            [bucket]: {
              ...prog[bucket],
              [contentId]: {
                ...entry,
                page: { ...entry.page, [key]: page },
                lastChapterId: key,
                updatedAt: Date.now(),
              },
            },
          },
        };
      });
    },
    [updateActiveReader],
  );

  // --- subscription ----------------------------------------------------------
  // Flip the account to a paid plan. (Until Mercado Pago is wired up this is
  // called by the dev "Simulate subscription" button on the paywall.)
  const upgradePlan = useCallback((plan = "Premium", sub = {}) => {
    setAccount((a) =>
      a
        ? {
            ...a,
            user: {
              ...a.user,
              plan,
              subscription: {
                status: "active",
                since: Date.now(),
                provider: "mock",
                ...sub,
              },
            },
          }
        : a,
    );
  }, []);

  // Revert to Free (dev helper for testing the paywall both ways).
  const cancelPlan = useCallback(() => {
    setAccount((a) =>
      a ? { ...a, user: { ...a.user, plan: "Free", subscription: null } } : a,
    );
  }, []);

  const buildReaderStats = (reader) => {
    const progress = reader?.progress || {};

    const storiesRead = Object.values(progress.stories || {}).filter(
      (story) => Object.keys(story.completed || {}).length > 0,
    ).length;

    const minutesByDate = progress.activity?.minutesByDate || {};

    const totalMinutes = Math.round(
      Object.values(minutesByDate).reduce(
        (sum, mins) => sum + Number(mins || 0),
        0,
      ),
    );

    const activeDates = progress.activity?.activeDates || {};

    let streak = 0;
    let current = new Date();

    while (true) {
      const day = current.toISOString().slice(0, 10);

      if (!activeDates[day]) break;

      streak++;
      current.setDate(current.getDate() - 1);
    }

    return {
      ...(reader.stats || {}),
      streak,
      storiesRead,
      minutesThisWeek: totalMinutes,
      lettersLearned: storiesRead * 2,
    };
  };

  const value = useMemo(() => {
    const readers =
      account?.readers?.map((reader) => ({
        ...reader,
        stats: buildReaderStats(reader),
      })) || [];

    const activeReader =
      readers.find((r) => r.id === account?.activeReaderId) ||
      readers[0] ||
      null;
    return {
      ready,
      isAuthed: !!account,
      user: account?.user || null,
      readers,
      activeReader,
      login,
      signup,
      logout,
      updateAccount,
      addReader,
      updateReader,
      removeReader,
      setActiveReader,
      markChapterRead,
      recordReading,
      saveReadingPosition,
      upgradePlan,
      cancelPlan,
    };
  }, [
    account,
    ready,
    login,
    signup,
    logout,
    updateAccount,
    addReader,
    updateReader,
    removeReader,
    setActiveReader,
    markChapterRead,
    recordReading,
    saveReadingPosition,
    upgradePlan,
    cancelPlan,
  ]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
