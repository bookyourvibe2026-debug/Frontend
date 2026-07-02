export const VENDOR_SESSION_KEY = "byv.vendor.session";

export const DEMO_VENDOR_CREDENTIALS = {
  email: "vendor@bookyourvibes.com",
  phone: "9876543210",
  staffId: "STAFF-0001",
  subadminId: "SUB-0001",
  password: "ByvDemo@123",
  otp: "123456",
} as const;

export type VendorSession = {
  vendorName: string;
  businessName: string;
  email: string;
  role: "vendor" | "staff" | "subadmin";
  loggedInAt: string;
};

export const DEMO_VENDOR_SESSION: VendorSession = {
  vendorName: "Aman Gupta",
  businessName: "Arena 11 Sports & Events",
  email: DEMO_VENDOR_CREDENTIALS.email,
  role: "vendor",
  loggedInAt: new Date().toISOString(),
};

export function getVendorSession(): VendorSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(VENDOR_SESSION_KEY);
    return raw ? (JSON.parse(raw) as VendorSession) : null;
  } catch {
    return null;
  }
}

export function setVendorSession(session: VendorSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(VENDOR_SESSION_KEY, JSON.stringify(session));
}

export function clearVendorSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(VENDOR_SESSION_KEY);
}
