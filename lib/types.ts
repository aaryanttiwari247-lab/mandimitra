export type BookingStatus =
  | "WAITING"
  | "CALLED"
  | "VERIFIED"
  | "PROCESSING"
  | "COMPLETED"
  | "CANCELLED";

export type FarmerUser = {
  mobile: string;
  name: string;
  farmerId: string;
  farmerCode?: string;
  village?: string;
  district?: string;
  landAcres?: number;
  primaryCrop?: string;
  loginTime: string;
};

export type OfficialUser = {
  officialId: string;
  name: string;
  centreName: string;
  role: string;
  loginTime: string;
};

export type Centre = {
  name: string;
  distance: string;
  farmers: number;
  wait: number;
  recommended?: boolean;
};

export type TimeSlot = {
  time: string;
  shortTime: string;
  available: number;
};

export type Booking = {
  bookingId: string;
  tokenNumber: number;
  token: string;

  farmerId: string;
  farmerName: string;
  farmerMobile: string;

  crop: string;
  quantity: number;

  date: string;
  centre: string;
  centreId?: string;
  distance?: string;

  time: string;
  fullTime?: string;

  availableSlots?: number;
  queuePosition?: number;
  waitTime?: number;

  status: BookingStatus;
  queueStatus?: string;
  procurementStatus?: string;

  cropGrade?: "Grade A" | "Grade B" | "Grade C" | "Grade D";
  mspRate?: number; // In Rs./quintal
  totalPayout?: number; // quantity * mspRate
  actualQuantity?: number; // Weighed quantity in quintals
  paymentStatus?: "PENDING" | "CALCULATED" | "APPROVED" | "PAID";

  calledAt?: string | null;
  processingStartedAt?: string | null;
  completedAt?: string | null;
  verifiedBy?: string | null;

  arrivalTime?: string;

  createdAt: string;
  updatedAt: string;
};

