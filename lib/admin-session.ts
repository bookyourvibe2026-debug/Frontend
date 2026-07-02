export const ADMIN_SESSION_KEY = "byv.admin.session";

export const DEMO_ADMIN_CREDENTIALS = {
  email: "admin@bookyourvibe.in",
  password: "ByvAdmin@123",
} as const;

export type AdminSession = {
  adminName: string;
  email: string;
  role: "super_admin";
  loggedInAt: string;
};

export const DEMO_ADMIN_SESSION: AdminSession = {
  adminName: "Super Admin",
  email: DEMO_ADMIN_CREDENTIALS.email,
  role: "super_admin",
  loggedInAt: new Date().toISOString(),
};

export function getAdminSession(): AdminSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(ADMIN_SESSION_KEY);
    return raw ? (JSON.parse(raw) as AdminSession) : null;
  } catch {
    return null;
  }
}

export function setAdminSession(session: AdminSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
}

export function clearAdminSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ADMIN_SESSION_KEY);
}
