export type OfficialUser = {
  officialId: string;
  name: string;
  centreName: string;
  role: string;
  loginTime: string;
};

const OFFICIAL_SESSION_KEY = "smart_procurement_official";

// ============================================================
// DEMO OFFICIAL ACCOUNT
// ============================================================

const DEMO_OFFICIAL_ID = "OFF001";
const DEMO_OFFICIAL_PASSWORD = "admin123";

// ============================================================
// LOGIN
// ============================================================

export function loginOfficial(
  officialId: string,
  password: string
): OfficialUser | null {
  if (
    officialId.trim().toUpperCase() !== DEMO_OFFICIAL_ID ||
    password !== DEMO_OFFICIAL_PASSWORD
  ) {
    return null;
  }

  const official: OfficialUser = {
    officialId: DEMO_OFFICIAL_ID,
    name: "Procurement Officer",
    centreName: "Lakshmipur Procurement Centre",
    role: "Centre Official",
    loginTime: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(
      OFFICIAL_SESSION_KEY,
      JSON.stringify(official)
    );
  }

  return official;
}

// ============================================================
// GET CURRENT OFFICIAL SESSION
// ============================================================

export function getOfficialSession(): OfficialUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = localStorage.getItem(OFFICIAL_SESSION_KEY);

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as OfficialUser;
  } catch {
    localStorage.removeItem(OFFICIAL_SESSION_KEY);
    return null;
  }
}

// ============================================================
// LOGOUT
// ============================================================

export function clearOfficialSession() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(OFFICIAL_SESSION_KEY);
}

// ============================================================
// CHECK LOGIN STATUS
// ============================================================

export function isOfficialLoggedIn(): boolean {
  return getOfficialSession() !== null;
}