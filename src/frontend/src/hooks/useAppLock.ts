import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

export interface UseAppLockReturn {
  isLocked: boolean;
  unlock: () => void;
  lock: () => void;
  logout: () => Promise<void>;
  resetIdleTimer: () => void;
}

// ─── App Lock Enabled preference (stored in localStorage) ────────────────────
const APP_LOCK_ENABLED_KEY = "open_tip_pay_app_lock_enabled";

export function getAppLockEnabled(): boolean {
  try {
    return localStorage.getItem(APP_LOCK_ENABLED_KEY) === "true";
  } catch {
    return false;
  }
}

export function setAppLockEnabled(enabled: boolean): void {
  try {
    if (enabled) {
      localStorage.setItem(APP_LOCK_ENABLED_KEY, "true");
    } else {
      localStorage.removeItem(APP_LOCK_ENABLED_KEY);
    }
  } catch {
    // localStorage unavailable — silently ignore
  }
}

/** React hook — returns current enabled state + a setter that re-renders callers */
export function useAppLockEnabledPref(): [boolean, (enabled: boolean) => void] {
  const [enabled, setEnabled] = useState<boolean>(getAppLockEnabled);

  const toggle = useCallback((next: boolean) => {
    setAppLockEnabled(next);
    setEnabled(next);
  }, []);

  return [enabled, toggle];
}

const IDLE_TIMEOUT_MS = 60 * 1000; // 60 seconds

export function useAppLock(): UseAppLockReturn {
  const [isLocked, setIsLocked] = useState(true);
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  // Ref so resetIdleTimer always reads the latest isLocked without needing it as a dep
  const isLockedRef = useRef(isLocked);
  useEffect(() => {
    isLockedRef.current = isLocked;
  }, [isLocked]);

  const resetIdleTimer = useCallback(() => {
    lastActivityRef.current = Date.now();

    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    // Only set idle timer if unlocked and authenticated (use ref to avoid stale closure)
    if (!isLockedRef.current && identity) {
      idleTimerRef.current = setTimeout(() => {
        setIsLocked(true);
      }, IDLE_TIMEOUT_MS);
    }
  }, [identity]);

  const unlock = useCallback(() => {
    setIsLocked(false);
    resetIdleTimer();
  }, [resetIdleTimer]);

  const lock = useCallback(() => {
    setIsLocked(true);
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const logout = useCallback(async () => {
    await clear();
    queryClient.clear();
    setIsLocked(true);
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, [clear, queryClient]);

  // Track user activity
  useEffect(() => {
    if (!identity || isLocked) return;

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "pointermove",
    ];

    const handleActivity = () => {
      resetIdleTimer();
    };

    for (const event of events) {
      document.addEventListener(event, handleActivity, { passive: true });
    }

    // Initial timer setup
    resetIdleTimer();

    return () => {
      for (const event of events) {
        document.removeEventListener(event, handleActivity);
      }
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [identity, isLocked, resetIdleTimer]);

  // Reset lock state when identity changes (logout)
  useEffect(() => {
    if (!identity) {
      setIsLocked(true);
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    }
  }, [identity]);

  return {
    isLocked,
    unlock,
    lock,
    logout,
    resetIdleTimer,
  };
}
