import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

export interface UseAppLockReturn {
  isLocked: boolean;
  unlock: () => void;
  lock: () => void;
  logout: () => Promise<void>;
  resetIdleTimer: () => void;
}

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
    // localStorage unavailable
  }
}

export function useAppLockEnabledPref(): [boolean, (enabled: boolean) => void] {
  const [enabled, setEnabled] = useState<boolean>(getAppLockEnabled);

  const toggle = useCallback((next: boolean) => {
    setAppLockEnabled(next);
    setEnabled(next);
  }, []);

  return [enabled, toggle];
}

const IDLE_TIMEOUT_MS = 60 * 1000;

export function useAppLock(): UseAppLockReturn {
  const [isLocked, setIsLocked] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const queryClient = useQueryClient();
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const isLockedRef = useRef(isLocked);

  useEffect(() => {
    isLockedRef.current = isLocked;
  }, [isLocked]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session);
      if (!session) {
        setIsLocked(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const resetIdleTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (!isLockedRef.current && hasSession) {
      idleTimerRef.current = setTimeout(() => {
        setIsLocked(true);
      }, IDLE_TIMEOUT_MS);
    }
  }, [hasSession]);

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
    await supabase.auth.signOut();
    queryClient.clear();
    setIsLocked(true);
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, [queryClient]);

  useEffect(() => {
    if (!hasSession || isLocked) return;
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "pointermove"];
    const handleActivity = () => resetIdleTimer();
    for (const event of events) {
      document.addEventListener(event, handleActivity, { passive: true });
    }
    resetIdleTimer();
    return () => {
      for (const event of events) {
        document.removeEventListener(event, handleActivity);
      }
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [hasSession, isLocked, resetIdleTimer]);

  useEffect(() => {
    if (!hasSession) {
      setIsLocked(true);
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    }
  }, [hasSession]);

  return { isLocked, unlock, lock, logout, resetIdleTimer };
}
