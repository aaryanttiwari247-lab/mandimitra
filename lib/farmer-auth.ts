import { FarmerUser } from "./types";

export type { FarmerUser };

const FARMER_SESSION_KEY = "smart_procurement_farmer";
const FARMER_OTP_KEY = "smart_procurement_otp";
const FARMERS_REGISTRY_KEY = "smart_procurement_farmers_registry";

export function getRegisteredFarmers(): Record<string, FarmerUser> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(FARMERS_REGISTRY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function findFarmerByAadhaar(aadhaar: string): FarmerUser | null {
  const clean = aadhaar.replace(/\D/g, "");
  if (!clean || clean.length !== 12) return null;
  const farmers = getRegisteredFarmers();
  return (
    Object.values(farmers).find(
      (f) => f.aadhaar && f.aadhaar.replace(/\D/g, "") === clean
    ) || null
  );
}

export function registerFarmerProfile(data: {
  mobile: string;
  name: string;
  aadhaar?: string;
  village?: string;
  district?: string;
  landAcres?: number;
  primaryCrop?: string;
}): FarmerUser {
  const farmers = getRegisteredFarmers();
  const farmerId = `FMR${data.mobile.slice(-4)}`;
  const farmer: FarmerUser = {
    ...data,
    farmerId,
    farmerCode: farmerId,
    loginTime: new Date().toISOString(),
  };

  farmers[data.mobile] = farmer;
  if (typeof window !== "undefined") {
    localStorage.setItem(FARMERS_REGISTRY_KEY, JSON.stringify(farmers));
    localStorage.setItem(FARMER_SESSION_KEY, JSON.stringify(farmer));
    // Clear any previous farmer's active booking on new registration
    localStorage.removeItem("smartProcurementBooking");
  }
  return farmer;
}

export function saveFarmerSession(input: string | (Partial<FarmerUser> & { mobile: string })): FarmerUser {
  const farmerData = typeof input === "string" ? { mobile: input } : input;
  const farmers = getRegisteredFarmers();
  const existing = farmers[farmerData.mobile];

  const farmerId = farmerData.farmerId || existing?.farmerId || `FMR${farmerData.mobile.slice(-4)}`;
  const farmerCode = farmerData.farmerCode || existing?.farmerCode || farmerId;
  const name = farmerData.name || existing?.name || `Farmer (${farmerData.mobile.slice(-4)})`;

  const farmer: FarmerUser = {
    mobile: farmerData.mobile,
    name,
    farmerId,
    farmerCode,
    aadhaar: farmerData.aadhaar !== undefined ? farmerData.aadhaar : existing?.aadhaar,
    village: farmerData.village !== undefined ? farmerData.village : existing?.village,
    district: farmerData.district !== undefined ? farmerData.district : existing?.district,
    landAcres: farmerData.landAcres !== undefined ? farmerData.landAcres : existing?.landAcres,
    primaryCrop: farmerData.primaryCrop !== undefined ? farmerData.primaryCrop : existing?.primaryCrop,
    loginTime: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    // Check if the previous session was for a different phone number
    const oldSession = getFarmerSession();
    if (oldSession && oldSession.mobile !== farmer.mobile) {
      // Clear previous farmer's single-booking cache so different farmer doesn't see old booking
      localStorage.removeItem("smartProcurementBooking");
    }
    localStorage.setItem(FARMER_SESSION_KEY, JSON.stringify(farmer));
  }

  return farmer;
}

export function getFarmerSession(): FarmerUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = localStorage.getItem(FARMER_SESSION_KEY);
  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as FarmerUser;
  } catch {
    localStorage.removeItem(FARMER_SESSION_KEY);
    return null;
  }
}

export function clearFarmerSession() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(FARMER_SESSION_KEY);
  localStorage.removeItem(FARMER_OTP_KEY);
  localStorage.removeItem("smartProcurementBooking");
  window.dispatchEvent(new Event("smartProcurementBookingUpdated"));
  window.dispatchEvent(new Event("smartProcurementQueueUpdated"));
}

export function saveOtp(otp: string) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(FARMER_OTP_KEY, otp);
}

export function getOtp(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(FARMER_OTP_KEY);
}

export function clearOtp() {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(FARMER_OTP_KEY);
}
