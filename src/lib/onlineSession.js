"use client";

const SESSION_KEY = "battle-matrix-online-session";

export function saveOnlineSession(session) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getOnlineSession() {
  if (typeof window === "undefined") return null;

  try {
    const rawSession = window.localStorage.getItem(SESSION_KEY);
    return rawSession ? JSON.parse(rawSession) : null;
  } catch {
    return null;
  }
}

export function clearOnlineSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}
