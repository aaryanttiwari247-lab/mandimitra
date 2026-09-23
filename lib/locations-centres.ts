import { normalizeCropName } from "./msp-rates";

export type ProcurementAgency =
  | "MPSCSC"
  | "FCI"
  | "NAFED"
  | "CCI"
  | "MARKFED"
  | "HAFED"
  | "RAJFED"
  | "APMC"
  | "PACS";

export interface ProcurementCentre {
  id: string;
  name: string;
  location: string;
  state: string;
  distance: string;
  bays: number;
  baseWaitMinutes: number;
  contactNumber: string;
  recommended?: boolean;
  acceptedCrops: string[];
  agencyType?: ProcurementAgency;
  operatingHours?: string;
  storageCapacityMT?: number;
  bayCapacityPerSlot?: number; // max farmers processed per bay in a 30-min window (default: 3)
}

export interface LocationOption {
  id: string;
  name: string;
  state: string;
  centresCount: number;
  latitude: number;
  longitude: number;
}

export const LOCATIONS_DATA: LocationOption[] = [
  // Madhya Pradesh (18 major agricultural districts)
  { id: "bhopal", name: "Bhopal", state: "Madhya Pradesh", centresCount: 4, latitude: 23.2599, longitude: 77.4126 },
  { id: "sehore", name: "Sehore", state: "Madhya Pradesh", centresCount: 4, latitude: 23.2032, longitude: 77.0844 },
  { id: "narmadapuram", name: "Narmadapuram", state: "Madhya Pradesh", centresCount: 4, latitude: 22.7519, longitude: 77.7289 },
  { id: "raisen", name: "Raisen", state: "Madhya Pradesh", centresCount: 3, latitude: 23.3304, longitude: 77.7818 },
  { id: "vidisha", name: "Vidisha", state: "Madhya Pradesh", centresCount: 3, latitude: 23.5251, longitude: 77.8081 },
  { id: "khargone", name: "Khargone", state: "Madhya Pradesh", centresCount: 4, latitude: 21.8219, longitude: 75.6190 },
  { id: "khandwa", name: "Khandwa", state: "Madhya Pradesh", centresCount: 3, latitude: 21.8314, longitude: 76.3498 },
  { id: "dhar", name: "Dhar", state: "Madhya Pradesh", centresCount: 3, latitude: 22.5978, longitude: 75.2974 },
  { id: "harda", name: "Harda", state: "Madhya Pradesh", centresCount: 2, latitude: 22.3444, longitude: 77.0935 },
  { id: "chhindwara", name: "Chhindwara", state: "Madhya Pradesh", centresCount: 3, latitude: 22.0574, longitude: 78.9382 },
  { id: "indore", name: "Indore", state: "Madhya Pradesh", centresCount: 3, latitude: 22.7196, longitude: 75.8577 },
  { id: "ujjain", name: "Ujjain", state: "Madhya Pradesh", centresCount: 3, latitude: 23.1765, longitude: 75.7885 },
  { id: "dewas", name: "Dewas", state: "Madhya Pradesh", centresCount: 3, latitude: 22.9676, longitude: 76.0534 },
  { id: "sagar", name: "Sagar", state: "Madhya Pradesh", centresCount: 3, latitude: 23.8388, longitude: 78.7378 },
  { id: "jabalpur", name: "Jabalpur", state: "Madhya Pradesh", centresCount: 3, latitude: 23.1815, longitude: 79.9864 },
  { id: "gwalior", name: "Gwalior", state: "Madhya Pradesh", centresCount: 2, latitude: 26.2183, longitude: 78.1828 },
  { id: "morena", name: "Morena", state: "Madhya Pradesh", centresCount: 3, latitude: 26.4948, longitude: 77.9940 },
  { id: "ratlam", name: "Ratlam", state: "Madhya Pradesh", centresCount: 2, latitude: 23.3315, longitude: 75.0367 },

  // Rajasthan (3 major mandis)
  { id: "kota", name: "Kota", state: "Rajasthan", centresCount: 3, latitude: 25.2138, longitude: 75.8648 },
  { id: "ganganagar", name: "Sri Ganganagar", state: "Rajasthan", centresCount: 3, latitude: 29.9038, longitude: 73.8772 },
  { id: "jaipur", name: "Jaipur", state: "Rajasthan", centresCount: 2, latitude: 26.9124, longitude: 75.7873 },

  // Haryana (2 major mandis)
  { id: "karnal", name: "Karnal", state: "Haryana", centresCount: 3, latitude: 29.6857, longitude: 76.9905 },
  { id: "ambala", name: "Ambala", state: "Haryana", centresCount: 2, latitude: 30.3782, longitude: 76.7767 },

  // Punjab (1 major grain hub)
  { id: "ludhiana", name: "Ludhiana", state: "Punjab", centresCount: 3, latitude: 30.9010, longitude: 75.8573 },

  // Maharashtra (2 major cotton & pulse hubs)
  { id: "nagpur", name: "Nagpur", state: "Maharashtra", centresCount: 3, latitude: 21.1458, longitude: 79.0882 },
  { id: "akola", name: "Akola", state: "Maharashtra", centresCount: 2, latitude: 20.7002, longitude: 77.0082 },

  // Uttar Pradesh (1 major hub)
  { id: "meerut", name: "Meerut", state: "Uttar Pradesh", centresCount: 2, latitude: 28.9845, longitude: 77.7064 },
];

export const PROCUREMENT_CENTRES: ProcurementCentre[] = [
  // =========================================================================
  // 1. Bhopal (Madhya Pradesh)
  // =========================================================================
  {
    id: "centre-bhopal-lakshmipur",
    name: "Lakshmipur Procurement Centre",
    location: "Bhopal",
    state: "Madhya Pradesh",
    distance: "4.7 km away",
    bays: 4,
    baseWaitMinutes: 20,
    contactNumber: "0755-2741021",
    recommended: true,
    acceptedCrops: ["Wheat", "Gram", "Mustard", "Barley"],
    agencyType: "MPSCSC",
    operatingHours: "09:30 AM – 05:00 PM",
    storageCapacityMT: 25000,
    bayCapacityPerSlot: 4,
  },
  {
    id: "centre-bhopal-rampur",
    name: "Rampur Procurement Centre",
    location: "Bhopal",
    state: "Madhya Pradesh",
    distance: "2.0 km away",
    bays: 3,
    baseWaitMinutes: 35,
    contactNumber: "0755-2741022",
    acceptedCrops: ["Wheat", "Paddy / Rice", "Barley"],
    agencyType: "MPSCSC",
    operatingHours: "09:30 AM – 05:00 PM",
    storageCapacityMT: 18000,
    bayCapacityPerSlot: 3,
  },
  {
    id: "centre-bhopal-karond",
    name: "Karond Krishi Upaj Mandi",
    location: "Bhopal",
    state: "Madhya Pradesh",
    distance: "6.5 km away",
    bays: 6,
    baseWaitMinutes: 25,
    contactNumber: "0755-2741023",
    acceptedCrops: ["Wheat", "Gram", "Mustard", "Soybean", "Maize", "Lentil"],
    agencyType: "APMC",
    operatingHours: "09:00 AM – 05:30 PM",
    storageCapacityMT: 50000,
    bayCapacityPerSlot: 4,
  },
  {
    id: "centre-bhopal-silo-mugaliya",
    name: "Mugaliya Chhap Modern Silo Terminal",
    location: "Bhopal",
    state: "Madhya Pradesh",
    distance: "14.2 km away",
    bays: 6,
    baseWaitMinutes: 15,
    contactNumber: "0755-2741024",
    acceptedCrops: ["Wheat", "Paddy / Rice"],
    agencyType: "FCI",
    operatingHours: "09:00 AM – 06:00 PM",
    storageCapacityMT: 100000,
    bayCapacityPerSlot: 5,
  },

  // =========================================================================
  // 2. Sehore (Madhya Pradesh)
  // =========================================================================
  {
    id: "centre-sehore-shivpur",
    name: "Shivpur Procurement Centre",
    location: "Sehore",
    state: "Madhya Pradesh",
    distance: "3.8 km away",
    bays: 3,
    baseWaitMinutes: 25,
    contactNumber: "07562-224101",
    recommended: true,
    acceptedCrops: ["Wheat", "Soybean", "Gram"],
    agencyType: "MPSCSC",
    operatingHours: "09:30 AM – 05:00 PM",
    storageCapacityMT: 15000,
    bayCapacityPerSlot: 3,
  },
  {
    id: "centre-sehore-central",
    name: "Sehore Central Krishi Upaj Mandi",
    location: "Sehore",
    state: "Madhya Pradesh",
    distance: "5.1 km away",
    bays: 5,
    baseWaitMinutes: 30,
    contactNumber: "07562-224102",
    acceptedCrops: ["Wheat", "Gram", "Soybean", "Mustard", "Moong"],
    agencyType: "APMC",
    operatingHours: "09:00 AM – 05:30 PM",
    storageCapacityMT: 40000,
    bayCapacityPerSlot: 4,
  },
  {
    id: "centre-sehore-ashta",
    name: "Ashta Grain & Oilseed Terminal",
    location: "Sehore",
    state: "Madhya Pradesh",
    distance: "12.4 km away",
    bays: 5,
    baseWaitMinutes: 20,
    contactNumber: "07562-224103",
    acceptedCrops: ["Wheat", "Gram", "Soybean", "Lentil", "Mustard", "Moong"],
    agencyType: "APMC",
    operatingHours: "09:00 AM – 05:30 PM",
    storageCapacityMT: 35000,
    bayCapacityPerSlot: 4,
  },
  {
    id: "centre-sehore-shyampur-pacs",
    name: "Shyampur PACS e-Uparjan Kendra",
    location: "Sehore",
    state: "Madhya Pradesh",
    distance: "16.8 km away",
    bays: 2,
    baseWaitMinutes: 20,
    contactNumber: "07562-224104",
    acceptedCrops: ["Wheat", "Paddy / Rice"],
    agencyType: "PACS",
    operatingHours: "09:30 AM – 04:30 PM",
    storageCapacityMT: 8000,
    bayCapacityPerSlot: 3,
  },

  // =========================================================================
  // 3. Narmadapuram / Hoshangabad (Madhya Pradesh)
  // =========================================================================
  {
    id: "centre-narmada-valley",
    name: "Narmada Valley Krishi Mandi",
    location: "Narmadapuram",
    state: "Madhya Pradesh",
    distance: "3.2 km away",
    bays: 5,
    baseWaitMinutes: 22,
    contactNumber: "07574-252101",
    recommended: true,
    acceptedCrops: ["Wheat", "Moong", "Paddy / Rice", "Gram"],
    agencyType: "APMC",
    operatingHours: "09:00 AM – 05:30 PM",
    storageCapacityMT: 45000,
    bayCapacityPerSlot: 4,
  },
  {
    id: "centre-narmada-itarsi",
    name: "Itarsi Railhead Silo Complex",
    location: "Narmadapuram",
    state: "Madhya Pradesh",
    distance: "8.5 km away",
    bays: 6,
    baseWaitMinutes: 30,
    contactNumber: "07574-252102",
    acceptedCrops: ["Wheat", "Paddy / Rice"],
    agencyType: "FCI",
    operatingHours: "09:00 AM – 06:00 PM",
    storageCapacityMT: 120000,
    bayCapacityPerSlot: 5,
  },
  {
    id: "centre-narmada-pipariya",
    name: "Pipariya Moong & Pulse Complex",
    location: "Narmadapuram",
    state: "Madhya Pradesh",
    distance: "15.0 km away",
    bays: 6,
    baseWaitMinutes: 18,
    contactNumber: "07574-252103",
    acceptedCrops: ["Moong", "Gram", "Urad", "Wheat", "Paddy / Rice", "Lentil"],
    agencyType: "MARKFED",
    operatingHours: "09:00 AM – 05:30 PM",
    storageCapacityMT: 60000,
    bayCapacityPerSlot: 5,
  },
  {
    id: "centre-narmada-babai",
    name: "Babai e-Uparjan Procurement Centre",
    location: "Narmadapuram",
    state: "Madhya Pradesh",
    distance: "18.3 km away",
    bays: 3,
    baseWaitMinutes: 20,
    contactNumber: "07574-252104",
    acceptedCrops: ["Wheat", "Moong", "Paddy / Rice"],
    agencyType: "MPSCSC",
    operatingHours: "09:30 AM – 05:00 PM",
    storageCapacityMT: 12000,
    bayCapacityPerSlot: 3,
  },

  // =========================================================================
  // 4. Raisen (Madhya Pradesh)
  // =========================================================================
  {
    id: "centre-raisen-main",
    name: "Raisen Krishi Upaj Mandi",
    location: "Raisen",
    state: "Madhya Pradesh",
    distance: "4.0 km away",
    bays: 4,
    baseWaitMinutes: 20,
    contactNumber: "07482-222101",
    recommended: true,
    acceptedCrops: ["Wheat", "Gram", "Lentil", "Soybean"],
    agencyType: "APMC",
    operatingHours: "09:30 AM – 05:00 PM",
    storageCapacityMT: 25000,
    bayCapacityPerSlot: 4,
  },
  {
    id: "centre-raisen-mandideep",
    name: "Mandideep Markfed Depot",
    location: "Raisen",
    state: "Madhya Pradesh",
    distance: "11.2 km away",
    bays: 5,
    baseWaitMinutes: 28,
    contactNumber: "07482-222102",
    acceptedCrops: ["Wheat", "Soybean", "Gram", "Mustard"],
    agencyType: "MARKFED",
    operatingHours: "09:00 AM – 05:30 PM",
    storageCapacityMT: 35000,
    bayCapacityPerSlot: 4,
  },
  {
    id: "centre-raisen-bareli",
    name: "Bareli Paddy & Grain Market",
    location: "Raisen",
    state: "Madhya Pradesh",
    distance: "26.5 km away",
    bays: 4,
    baseWaitMinutes: 22,
    contactNumber: "07482-222103",
    acceptedCrops: ["Paddy / Rice", "Wheat", "Gram"],
    agencyType: "APMC",
    operatingHours: "09:30 AM – 05:00 PM",
    storageCapacityMT: 20000,
    bayCapacityPerSlot: 3,
  },

  // =========================================================================
  // 5. Vidisha (Madhya Pradesh)
  // =========================================================================
  {
    id: "centre-vidisha-sharbati",
    name: "Vidisha Sharbati Wheat & Grain Mandi",
    location: "Vidisha",
    state: "Madhya Pradesh",
    distance: "3.5 km away",
    bays: 5,
    baseWaitMinutes: 25,
    contactNumber: "07592-233101",
    recommended: true,
    acceptedCrops: ["Wheat", "Gram", "Lentil", "Soybean"],
    agencyType: "APMC",
    operatingHours: "09:00 AM – 05:30 PM",
    storageCapacityMT: 45000,
    bayCapacityPerSlot: 4,
  },
  {
    id: "centre-vidisha-basoda",
    name: "Ganj Basoda APMC Terminal",
    location: "Vidisha",
    state: "Madhya Pradesh",
    distance: "14.8 km away",
    bays: 5,
    baseWaitMinutes: 22,
    contactNumber: "07592-233102",
    acceptedCrops: ["Gram", "Wheat", "Mustard", "Lentil", "Soybean"],
    agencyType: "APMC",
    operatingHours: "09:00 AM – 05:30 PM",
    storageCapacityMT: 40000,
    bayCapacityPerSlot: 4,
  },
  {
    id: "centre-vidisha-kurwai",
    name: "Kurwai Markfed Oilseed Depot",
    location: "Vidisha",
    state: "Madhya Pradesh",
    distance: "22.0 km away",
    bays: 3,
    baseWaitMinutes: 18,
    contactNumber: "07592-233103",
    acceptedCrops: ["Soybean", "Mustard", "Wheat", "Gram"],
    agencyType: "MARKFED",
    operatingHours: "09:30 AM – 05:00 PM",
    storageCapacityMT: 15000,
    bayCapacityPerSlot: 3,
  },

  // =========================================================================
  // 6. Khargone / West Nimar (Madhya Pradesh) — Major Cotton & Chilli Belt
  // =========================================================================
  {
    id: "centre-khargone-main-cotton",
    name: "Khargone APMC Cotton & Grain Mandi",
    location: "Khargone",
    state: "Madhya Pradesh",
    distance: "2.8 km away",
    bays: 6,
    baseWaitMinutes: 20,
    contactNumber: "07282-231101",
    recommended: true,
    acceptedCrops: ["Cotton", "Soybean", "Maize", "Wheat", "Gram"],
    agencyType: "APMC",
    operatingHours: "09:00 AM – 06:00 PM",
    storageCapacityMT: 55000,
    bayCapacityPerSlot: 5,
  },
  {
    id: "centre-khargone-cci-sanawad",
    name: "CCI Sanawad Cotton Procurement Depot",
    location: "Khargone",
    state: "Madhya Pradesh",
    distance: "12.5 km away",
    bays: 5,
    baseWaitMinutes: 15,
    contactNumber: "07282-231102",
    acceptedCrops: ["Cotton"],
    agencyType: "CCI",
    operatingHours: "08:30 AM – 06:00 PM",
    storageCapacityMT: 30000,
    bayCapacityPerSlot: 4,
  },
  {
    id: "centre-khargone-bhikangaon",
    name: "Bhikangaon Krishi Upaj Mandi",
    location: "Khargone",
    state: "Madhya Pradesh",
    distance: "18.2 km away",
    bays: 4,
    baseWaitMinutes: 22,
    contactNumber: "07282-231103",
    acceptedCrops: ["Cotton", "Soybean", "Gram", "Wheat", "Maize"],
    agencyType: "APMC",
    operatingHours: "09:00 AM – 05:30 PM",
    storageCapacityMT: 22000,
    bayCapacityPerSlot: 3,
  },
  {
    id: "centre-khargone-kasrawad",
    name: "Kasrawad Markfed Complex",
    location: "Khargone",
    state: "Madhya Pradesh",
    distance: "24.0 km away",
    bays: 3,
    baseWaitMinutes: 25,
    contactNumber: "07282-231104",
    acceptedCrops: ["Cotton", "Wheat", "Maize", "Soybean"],
    agencyType: "MARKFED",
    operatingHours: "09:30 AM – 05:00 PM",
    storageCapacityMT: 16000,
    bayCapacityPerSlot: 3,
  },

  // =========================================================================
  // 7. Khandwa / East Nimar (Madhya Pradesh)
  // =========================================================================
  {
    id: "centre-khandwa-main",
    name: "Khandwa APMC Main Mandi",
    location: "Khandwa",
    state: "Madhya Pradesh",
    distance: "3.4 km away",
    bays: 5,
    baseWaitMinutes: 22,
    contactNumber: "07332-224101",
    recommended: true,
    acceptedCrops: ["Cotton", "Soybean", "Wheat", "Gram", "Jowar / Sorghum"],
    agencyType: "APMC",
    operatingHours: "09:00 AM – 05:30 PM",
    storageCapacityMT: 45000,
    bayCapacityPerSlot: 4,
  },
  {
    id: "centre-khandwa-cci-pandhana",
    name: "CCI Pandhana Cotton Complex",
    location: "Khandwa",
    state: "Madhya Pradesh",
    distance: "14.6 km away",
    bays: 4,
    baseWaitMinutes: 18,
    contactNumber: "07332-224102",
    acceptedCrops: ["Cotton"],
    agencyType: "CCI",
    operatingHours: "09:00 AM – 06:00 PM",
    storageCapacityMT: 25000,
    bayCapacityPerSlot: 4,
  },
  {
    id: "centre-khandwa-harsud",
    name: "Harsud Grain & Pulse Depot",
    location: "Khandwa",
    state: "Madhya Pradesh",
    distance: "28.0 km away",
    bays: 3,
    baseWaitMinutes: 20,
    contactNumber: "07332-224103",
    acceptedCrops: ["Wheat", "Gram", "Moong", "Soybean"],
    agencyType: "MPSCSC",
    operatingHours: "09:30 AM – 05:00 PM",
    storageCapacityMT: 15000,
    bayCapacityPerSlot: 3,
  },

  // =========================================================================
  // 8. Dhar (Madhya Pradesh)
  // =========================================================================
  {
    id: "centre-dhar-main",
    name: "Dhar Krishi Upaj Mandi",
    location: "Dhar",
    state: "Madhya Pradesh",
    distance: "3.1 km away",
    bays: 4,
    baseWaitMinutes: 20,
    contactNumber: "07292-232101",
    recommended: true,
    acceptedCrops: ["Soybean", "Wheat", "Gram", "Cotton", "Maize"],
    agencyType: "APMC",
    operatingHours: "09:00 AM – 05:30 PM",
    storageCapacityMT: 30000,
    bayCapacityPerSlot: 4,
  },
  {
    id: "centre-dhar-kukshi",
    name: "Kukshi Cotton & Maize Terminal",
    location: "Dhar",
    state: "Madhya Pradesh",
    distance: "19.5 km away",
    bays: 4,
    baseWaitMinutes: 22,
    contactNumber: "07292-232102",
    acceptedCrops: ["Cotton", "Maize", "Soybean", "Jowar / Sorghum"],
    agencyType: "APMC",
    operatingHours: "09:00 AM – 05:30 PM",
    storageCapacityMT: 25000,
    bayCapacityPerSlot: 3,
  },
  {
    id: "centre-dhar-badnawar",
    name: "Badnawar Grain & Oilseed Centre",
    location: "Dhar",
    state: "Madhya Pradesh",
    distance: "22.4 km away",
    bays: 4,
    baseWaitMinutes: 18,
    contactNumber: "07292-232103",
    acceptedCrops: ["Wheat", "Soybean", "Gram", "Mustard"],
    agencyType: "APMC",
    operatingHours: "09:30 AM – 05:00 PM",
    storageCapacityMT: 20000,
    bayCapacityPerSlot: 3,
  },

  // =========================================================================
  // 9. Harda (Madhya Pradesh)
  // =========================================================================
  {
    id: "centre-harda-apmc",
    name: "Harda Moong & Wheat Terminal",
    location: "Harda",
    state: "Madhya Pradesh",
    distance: "2.5 km away",
    bays: 5,
    baseWaitMinutes: 20,
    contactNumber: "07577-222101",
    recommended: true,
    acceptedCrops: ["Wheat", "Moong", "Soybean", "Gram", "Urad"],
    agencyType: "APMC",
    operatingHours: "09:00 AM – 05:30 PM",
    storageCapacityMT: 45000,
    bayCapacityPerSlot: 4,
  },
  {
    id: "centre-harda-timarni",
    name: "Timarni Krishi Upaj Mandi",
    location: "Harda",
    state: "Madhya Pradesh",
    distance: "14.0 km away",
    bays: 4,
    baseWaitMinutes: 22,
    contactNumber: "07577-222102",
    acceptedCrops: ["Wheat", "Moong", "Gram", "Soybean"],
    agencyType: "APMC",
    operatingHours: "09:30 AM – 05:00 PM",
    storageCapacityMT: 25000,
    bayCapacityPerSlot: 3,
  },

  // =========================================================================
  // 10. Chhindwara (Madhya Pradesh) — Corn & Shree Anna Capital
  // =========================================================================
  {
    id: "centre-chhindwara-corn-city",
    name: "Chhindwara Corn City Mandi",
    location: "Chhindwara",
    state: "Madhya Pradesh",
    distance: "4.2 km away",
    bays: 6,
    baseWaitMinutes: 22,
    contactNumber: "07162-242101",
    recommended: true,
    acceptedCrops: ["Maize", "Wheat", "Soybean", "Gram", "Nigerseed"],
    agencyType: "APMC",
    operatingHours: "09:00 AM – 05:30 PM",
    storageCapacityMT: 60000,
    bayCapacityPerSlot: 5,
  },
  {
    id: "centre-chhindwara-sausar",
    name: "Sausar Cotton & Orange Mandi",
    location: "Chhindwara",
    state: "Madhya Pradesh",
    distance: "17.8 km away",
    bays: 4,
    baseWaitMinutes: 25,
    contactNumber: "07162-242102",
    acceptedCrops: ["Cotton", "Soybean", "Wheat", "Maize"],
    agencyType: "APMC",
    operatingHours: "09:00 AM – 05:30 PM",
    storageCapacityMT: 25000,
    bayCapacityPerSlot: 3,
  },
  {
    id: "centre-chhindwara-amarwara",
    name: "Amarwara Millets PACS Centre",
    location: "Chhindwara",
    state: "Madhya Pradesh",
    distance: "23.5 km away",
    bays: 3,
    baseWaitMinutes: 18,
    contactNumber: "07162-242103",
    acceptedCrops: ["Maize", "Nigerseed", "Ragi / Finger Millet", "Jowar / Sorghum"],
    agencyType: "PACS",
    operatingHours: "09:30 AM – 04:30 PM",
    storageCapacityMT: 12000,
    bayCapacityPerSlot: 3,
  },

  // =========================================================================
  // 11. Indore (Madhya Pradesh)
  // =========================================================================
  {
    id: "centre-indore-choithram",
    name: "Choithram Krishi Upaj Mandi",
    location: "Indore",
    state: "Madhya Pradesh",
    distance: "5.2 km away",
    bays: 6,
    baseWaitMinutes: 28,
    contactNumber: "0731-248101",
    recommended: true,
    acceptedCrops: ["Wheat", "Soybean", "Gram", "Mustard", "Maize", "Moong"],
    agencyType: "APMC",
    operatingHours: "09:00 AM – 06:00 PM",
    storageCapacityMT: 75000,
    bayCapacityPerSlot: 5,
  },
  {
    id: "centre-indore-sanwer",
    name: "Sanwer e-Uparjan Grain Hub",
    location: "Indore",
    state: "Madhya Pradesh",
    distance: "16.4 km away",
    bays: 4,
    baseWaitMinutes: 20,
    contactNumber: "0731-248102",
    acceptedCrops: ["Wheat", "Soybean", "Gram"],
    agencyType: "MPSCSC",
    operatingHours: "09:30 AM – 05:00 PM",
    storageCapacityMT: 20000,
    bayCapacityPerSlot: 4,
  },
  {
    id: "centre-indore-depalpur",
    name: "Depalpur Markfed Depot",
    location: "Indore",
    state: "Madhya Pradesh",
    distance: "21.0 km away",
    bays: 4,
    baseWaitMinutes: 24,
    contactNumber: "0731-248103",
    acceptedCrops: ["Wheat", "Gram", "Soybean", "Mustard"],
    agencyType: "MARKFED",
    operatingHours: "09:30 AM – 05:00 PM",
    storageCapacityMT: 22000,
    bayCapacityPerSlot: 3,
  },

  // =========================================================================
  // 12. Ujjain (Madhya Pradesh)
  // =========================================================================
  {
    id: "centre-ujjain-chimanganj",
    name: "Chimanganj Krishi Upaj Mandi",
    location: "Ujjain",
    state: "Madhya Pradesh",
    distance: "4.1 km away",
    bays: 7,
    baseWaitMinutes: 30,
    contactNumber: "0734-251101",
    recommended: true,
    acceptedCrops: ["Wheat", "Soybean", "Gram", "Mustard", "Lentil", "Moong"],
    agencyType: "APMC",
    operatingHours: "09:00 AM – 06:00 PM",
    storageCapacityMT: 80000,
    bayCapacityPerSlot: 5,
  },
  {
    id: "centre-ujjain-mahidpur",
    name: "Mahidpur Oilseed Terminal",
    location: "Ujjain",
    state: "Madhya Pradesh",
    distance: "18.6 km away",
    bays: 4,
    baseWaitMinutes: 20,
    contactNumber: "0734-251102",
    acceptedCrops: ["Mustard", "Wheat", "Gram", "Soybean"],
    agencyType: "APMC",
    operatingHours: "09:30 AM – 05:00 PM",
    storageCapacityMT: 20000,
    bayCapacityPerSlot: 3,
  },
  {
    id: "centre-ujjain-tarana",
    name: "Tarana Markfed Depot",
    location: "Ujjain",
    state: "Madhya Pradesh",
    distance: "22.5 km away",
    bays: 3,
    baseWaitMinutes: 22,
    contactNumber: "0734-251103",
    acceptedCrops: ["Soybean", "Wheat", "Gram"],
    agencyType: "MARKFED",
    operatingHours: "09:30 AM – 05:00 PM",
    storageCapacityMT: 15000,
    bayCapacityPerSlot: 3,
  },

  // =========================================================================
  // 13. Dewas (Madhya Pradesh)
  // =========================================================================
  {
    id: "centre-dewas-central",
    name: "Dewas Krishi Upaj Mandi",
    location: "Dewas",
    state: "Madhya Pradesh",
    distance: "3.7 km away",
    bays: 5,
    baseWaitMinutes: 25,
    contactNumber: "07272-255101",
    recommended: true,
    acceptedCrops: ["Soybean", "Wheat", "Gram", "Mustard"],
    agencyType: "APMC",
    operatingHours: "09:00 AM – 05:30 PM",
    storageCapacityMT: 45000,
    bayCapacityPerSlot: 4,
  },
  {
    id: "centre-dewas-sonkatch",
    name: "Sonkatch Markfed Centre",
    location: "Dewas",
    state: "Madhya Pradesh",
    distance: "15.3 km away",
    bays: 4,
    baseWaitMinutes: 18,
    contactNumber: "07272-255102",
    acceptedCrops: ["Wheat", "Soybean", "Gram"],
    agencyType: "MARKFED",
    operatingHours: "09:30 AM – 05:00 PM",
    storageCapacityMT: 20000,
    bayCapacityPerSlot: 3,
  },
  {
    id: "centre-dewas-bagli",
    name: "Bagli Tribal PACS Kendra",
    location: "Dewas",
    state: "Madhya Pradesh",
    distance: "24.1 km away",
    bays: 3,
    baseWaitMinutes: 20,
    contactNumber: "07272-255103",
    acceptedCrops: ["Maize", "Wheat", "Soybean", "Gram"],
    agencyType: "PACS",
    operatingHours: "09:30 AM – 04:30 PM",
    storageCapacityMT: 12000,
    bayCapacityPerSlot: 3,
  },

  // =========================================================================
  // 14. Sagar (Madhya Pradesh)
  // =========================================================================
  {
    id: "centre-sagar-main",
    name: "Sagar Krishi Upaj Mandi",
    location: "Sagar",
    state: "Madhya Pradesh",
    distance: "4.5 km away",
    bays: 5,
    baseWaitMinutes: 25,
    contactNumber: "07582-261101",
    recommended: true,
    acceptedCrops: ["Wheat", "Gram", "Lentil", "Soybean", "Mustard"],
    agencyType: "APMC",
    operatingHours: "09:00 AM – 05:30 PM",
    storageCapacityMT: 40000,
    bayCapacityPerSlot: 4,
  },
  {
    id: "centre-sagar-bina",
    name: "Bina Railhead Silo Complex",
    location: "Sagar",
    state: "Madhya Pradesh",
    distance: "19.0 km away",
    bays: 5,
    baseWaitMinutes: 20,
    contactNumber: "07582-261102",
    acceptedCrops: ["Wheat", "Gram", "Lentil"],
    agencyType: "FCI",
    operatingHours: "09:00 AM – 06:00 PM",
    storageCapacityMT: 70000,
    bayCapacityPerSlot: 4,
  },
  {
    id: "centre-sagar-khurai",
    name: "Khurai Pulse & Oilseed Terminal",
    location: "Sagar",
    state: "Madhya Pradesh",
    distance: "23.4 km away",
    bays: 4,
    baseWaitMinutes: 22,
    contactNumber: "07582-261103",
    acceptedCrops: ["Wheat", "Mustard", "Lentil", "Gram"],
    agencyType: "APMC",
    operatingHours: "09:30 AM – 05:00 PM",
    storageCapacityMT: 25000,
    bayCapacityPerSlot: 3,
  },

  // =========================================================================
  // 15. Jabalpur (Madhya Pradesh)
  // =========================================================================
  {
    id: "centre-jabalpur-main",
    name: "Jabalpur Krishi Upaj Mandi",
    location: "Jabalpur",
    state: "Madhya Pradesh",
    distance: "5.0 km away",
    bays: 5,
    baseWaitMinutes: 25,
    contactNumber: "0761-267101",
    recommended: true,
    acceptedCrops: ["Paddy / Rice", "Wheat", "Gram", "Moong"],
    agencyType: "APMC",
    operatingHours: "09:00 AM – 05:30 PM",
    storageCapacityMT: 50000,
    bayCapacityPerSlot: 4,
  },
  {
    id: "centre-jabalpur-patan",
    name: "Patan Markfed Procurement Centre",
    location: "Jabalpur",
    state: "Madhya Pradesh",
    distance: "14.5 km away",
    bays: 4,
    baseWaitMinutes: 20,
    contactNumber: "0761-267102",
    acceptedCrops: ["Paddy / Rice", "Gram", "Wheat", "Moong"],
    agencyType: "MARKFED",
    operatingHours: "09:30 AM – 05:00 PM",
    storageCapacityMT: 25000,
    bayCapacityPerSlot: 3,
  },
  {
    id: "centre-jabalpur-sihora",
    name: "Sihora Grain Procurement Depot",
    location: "Jabalpur",
    state: "Madhya Pradesh",
    distance: "22.8 km away",
    bays: 3,
    baseWaitMinutes: 22,
    contactNumber: "0761-267103",
    acceptedCrops: ["Paddy / Rice", "Wheat"],
    agencyType: "MPSCSC",
    operatingHours: "09:30 AM – 05:00 PM",
    storageCapacityMT: 15000,
    bayCapacityPerSlot: 3,
  },

  // =========================================================================
  // 16. Gwalior (Madhya Pradesh)
  // =========================================================================
  {
    id: "centre-gwalior-laxmiganj",
    name: "Laxmiganj Krishi Upaj Mandi",
    location: "Gwalior",
    state: "Madhya Pradesh",
    distance: "4.8 km away",
    bays: 5,
    baseWaitMinutes: 25,
    contactNumber: "0751-245101",
    recommended: true,
    acceptedCrops: ["Mustard", "Wheat", "Bajra / Pearl Millet", "Gram"],
    agencyType: "APMC",
    operatingHours: "09:00 AM – 05:30 PM",
    storageCapacityMT: 35000,
    bayCapacityPerSlot: 4,
  },
  {
    id: "centre-gwalior-dabra",
    name: "Dabra Rice & Grain Terminal",
    location: "Gwalior",
    state: "Madhya Pradesh",
    distance: "18.2 km away",
    bays: 5,
    baseWaitMinutes: 28,
    contactNumber: "0751-245102",
    acceptedCrops: ["Paddy / Rice", "Wheat", "Mustard"],
    agencyType: "APMC",
    operatingHours: "09:00 AM – 05:30 PM",
    storageCapacityMT: 45000,
    bayCapacityPerSlot: 4,
  },

  // =========================================================================
  // 17. Morena (Madhya Pradesh) — India's Premier Mustard Capital
  // =========================================================================
  {
    id: "centre-morena-main-mustard",
    name: "Morena Central Mustard Mandi",
    location: "Morena",
    state: "Madhya Pradesh",
    distance: "3.2 km away",
    bays: 6,
    baseWaitMinutes: 20,
    contactNumber: "07532-234101",
    recommended: true,
    acceptedCrops: ["Mustard", "Bajra / Pearl Millet", "Wheat", "Toria"],
    agencyType: "APMC",
    operatingHours: "09:00 AM – 06:00 PM",
    storageCapacityMT: 60000,
    bayCapacityPerSlot: 5,
  },
  {
    id: "centre-morena-ambah",
    name: "Ambah Markfed Oilseed Depot",
    location: "Morena",
    state: "Madhya Pradesh",
    distance: "16.5 km away",
    bays: 4,
    baseWaitMinutes: 22,
    contactNumber: "07532-234102",
    acceptedCrops: ["Mustard", "Bajra / Pearl Millet", "Wheat"],
    agencyType: "MARKFED",
    operatingHours: "09:30 AM – 05:00 PM",
    storageCapacityMT: 25000,
    bayCapacityPerSlot: 3,
  },
  {
    id: "centre-morena-porsa",
    name: "Porsa Grain & Bajra Centre",
    location: "Morena",
    state: "Madhya Pradesh",
    distance: "24.0 km away",
    bays: 3,
    baseWaitMinutes: 20,
    contactNumber: "07532-234103",
    acceptedCrops: ["Bajra / Pearl Millet", "Mustard", "Wheat"],
    agencyType: "MPSCSC",
    operatingHours: "09:30 AM – 05:00 PM",
    storageCapacityMT: 18000,
    bayCapacityPerSlot: 3,
  },

  // =========================================================================
  // 18. Ratlam (Madhya Pradesh)
  // =========================================================================
  {
    id: "centre-ratlam-main",
    name: "Ratlam APMC Mandi",
    location: "Ratlam",
    state: "Madhya Pradesh",
    distance: "3.6 km away",
    bays: 5,
    baseWaitMinutes: 22,
    contactNumber: "07412-228101",
    recommended: true,
    acceptedCrops: ["Wheat", "Soybean", "Gram", "Cotton", "Mustard"],
    agencyType: "APMC",
    operatingHours: "09:00 AM – 05:30 PM",
    storageCapacityMT: 40000,
    bayCapacityPerSlot: 4,
  },
  {
    id: "centre-ratlam-jaora",
    name: "Jaora Grain & Oilseed Terminal",
    location: "Ratlam",
    state: "Madhya Pradesh",
    distance: "17.4 km away",
    bays: 4,
    baseWaitMinutes: 20,
    contactNumber: "07412-228102",
    acceptedCrops: ["Soybean", "Wheat", "Mustard", "Gram"],
    agencyType: "APMC",
    operatingHours: "09:30 AM – 05:00 PM",
    storageCapacityMT: 30000,
    bayCapacityPerSlot: 3,
  },

  // =========================================================================
  // 19. Kota (Rajasthan)
  // =========================================================================
  {
    id: "centre-kota-bhamashah",
    name: "Bhamashah Krishi Upaj Mandi",
    location: "Kota",
    state: "Rajasthan",
    distance: "5.5 km away",
    bays: 6,
    baseWaitMinutes: 30,
    contactNumber: "0744-249101",
    recommended: true,
    acceptedCrops: ["Soybean", "Mustard", "Wheat", "Paddy / Rice", "Gram"],
    agencyType: "APMC",
    operatingHours: "09:00 AM – 06:00 PM",
    storageCapacityMT: 70000,
    bayCapacityPerSlot: 5,
  },
  {
    id: "centre-kota-ramganj",
    name: "Ramganj Mandi Grain Complex",
    location: "Kota",
    state: "Rajasthan",
    distance: "16.0 km away",
    bays: 4,
    baseWaitMinutes: 22,
    contactNumber: "0744-249102",
    acceptedCrops: ["Mustard", "Soybean", "Wheat", "Gram"],
    agencyType: "APMC",
    operatingHours: "09:30 AM – 05:30 PM",
    storageCapacityMT: 35000,
    bayCapacityPerSlot: 4,
  },
  {
    id: "centre-kota-cci-cotton",
    name: "CCI Kota Cotton Procurement Centre",
    location: "Kota",
    state: "Rajasthan",
    distance: "14.2 km away",
    bays: 4,
    baseWaitMinutes: 18,
    contactNumber: "0744-249103",
    acceptedCrops: ["Cotton"],
    agencyType: "CCI",
    operatingHours: "08:30 AM – 05:30 PM",
    storageCapacityMT: 20000,
    bayCapacityPerSlot: 4,
  },

  // =========================================================================
  // 20. Sri Ganganagar (Rajasthan) — Major Cotton, Mustard & Barley Belt
  // =========================================================================
  {
    id: "centre-ganganagar-main",
    name: "Sri Ganganagar Main Grain Market",
    location: "Sri Ganganagar",
    state: "Rajasthan",
    distance: "3.8 km away",
    bays: 6,
    baseWaitMinutes: 24,
    contactNumber: "0154-244101",
    recommended: true,
    acceptedCrops: ["Wheat", "Mustard", "Barley", "Gram", "Cotton"],
    agencyType: "APMC",
    operatingHours: "09:00 AM – 06:00 PM",
    storageCapacityMT: 65000,
    bayCapacityPerSlot: 5,
  },
  {
    id: "centre-ganganagar-suratgarh-cci",
    name: "Suratgarh CCI Cotton Terminal",
    location: "Sri Ganganagar",
    state: "Rajasthan",
    distance: "18.5 km away",
    bays: 5,
    baseWaitMinutes: 18,
    contactNumber: "0154-244102",
    acceptedCrops: ["Cotton", "Mustard", "Gram"],
    agencyType: "CCI",
    operatingHours: "08:30 AM – 06:00 PM",
    storageCapacityMT: 35000,
    bayCapacityPerSlot: 4,
  },
  {
    id: "centre-ganganagar-raisinghnagar",
    name: "Raisinghnagar APMC Terminal",
    location: "Sri Ganganagar",
    state: "Rajasthan",
    distance: "26.0 km away",
    bays: 4,
    baseWaitMinutes: 20,
    contactNumber: "0154-244103",
    acceptedCrops: ["Mustard", "Barley", "Wheat", "Gram"],
    agencyType: "RAJFED",
    operatingHours: "09:30 AM – 05:00 PM",
    storageCapacityMT: 25000,
    bayCapacityPerSlot: 3,
  },

  // =========================================================================
  // 21. Jaipur (Rajasthan)
  // =========================================================================
  {
    id: "centre-jaipur-surajpole",
    name: "Surajpole Krishi Upaj Mandi",
    location: "Jaipur",
    state: "Rajasthan",
    distance: "6.2 km away",
    bays: 5,
    baseWaitMinutes: 28,
    contactNumber: "0141-263101",
    recommended: true,
    acceptedCrops: ["Wheat", "Mustard", "Bajra / Pearl Millet", "Barley", "Gram"],
    agencyType: "APMC",
    operatingHours: "09:00 AM – 05:30 PM",
    storageCapacityMT: 50000,
    bayCapacityPerSlot: 4,
  },
  {
    id: "centre-jaipur-chomu",
    name: "Chomu APMC Grain Mandi",
    location: "Jaipur",
    state: "Rajasthan",
    distance: "19.5 km away",
    bays: 4,
    baseWaitMinutes: 20,
    contactNumber: "0141-263102",
    acceptedCrops: ["Bajra / Pearl Millet", "Barley", "Gram", "Mustard"],
    agencyType: "RAJFED",
    operatingHours: "09:30 AM – 05:00 PM",
    storageCapacityMT: 25000,
    bayCapacityPerSlot: 3,
  },

  // =========================================================================
  // 22. Karnal (Haryana) — Basmati & Wheat Heart of India
  // =========================================================================
  {
    id: "centre-karnal-new-grain",
    name: "Karnal New Grain Market",
    location: "Karnal",
    state: "Haryana",
    distance: "3.5 km away",
    bays: 6,
    baseWaitMinutes: 22,
    contactNumber: "0184-225101",
    recommended: true,
    acceptedCrops: ["Paddy / Rice", "Wheat", "Mustard"],
    agencyType: "HAFED",
    operatingHours: "09:00 AM – 06:00 PM",
    storageCapacityMT: 80000,
    bayCapacityPerSlot: 5,
  },
  {
    id: "centre-karnal-gharaunda",
    name: "Gharaunda Grain Terminal",
    location: "Karnal",
    state: "Haryana",
    distance: "11.8 km away",
    bays: 5,
    baseWaitMinutes: 18,
    contactNumber: "0184-225102",
    acceptedCrops: ["Paddy / Rice", "Wheat"],
    agencyType: "FCI",
    operatingHours: "09:00 AM – 05:30 PM",
    storageCapacityMT: 60000,
    bayCapacityPerSlot: 4,
  },
  {
    id: "centre-karnal-assandh",
    name: "Assandh HAFED Mandi",
    location: "Karnal",
    state: "Haryana",
    distance: "21.5 km away",
    bays: 4,
    baseWaitMinutes: 20,
    contactNumber: "0184-225103",
    acceptedCrops: ["Paddy / Rice", "Wheat", "Bajra / Pearl Millet"],
    agencyType: "HAFED",
    operatingHours: "09:30 AM – 05:00 PM",
    storageCapacityMT: 30000,
    bayCapacityPerSlot: 3,
  },

  // =========================================================================
  // 23. Ambala (Haryana)
  // =========================================================================
  {
    id: "centre-ambala-city",
    name: "Ambala City Grain Market",
    location: "Ambala",
    state: "Haryana",
    distance: "4.0 km away",
    bays: 5,
    baseWaitMinutes: 20,
    contactNumber: "0171-254101",
    recommended: true,
    acceptedCrops: ["Paddy / Rice", "Wheat", "Maize"],
    agencyType: "HAFED",
    operatingHours: "09:00 AM – 05:30 PM",
    storageCapacityMT: 45000,
    bayCapacityPerSlot: 4,
  },
  {
    id: "centre-ambala-barara",
    name: "Barara Rice & Grain Depot",
    location: "Ambala",
    state: "Haryana",
    distance: "16.8 km away",
    bays: 4,
    baseWaitMinutes: 22,
    contactNumber: "0171-254102",
    acceptedCrops: ["Paddy / Rice", "Wheat"],
    agencyType: "FCI",
    operatingHours: "09:30 AM – 05:00 PM",
    storageCapacityMT: 30000,
    bayCapacityPerSlot: 3,
  },

  // =========================================================================
  // 24. Ludhiana (Punjab) — Home to Asia's Largest Grain Mandi
  // =========================================================================
  {
    id: "centre-ludhiana-khanna",
    name: "Khanna Asia's Largest Grain Mandi",
    location: "Ludhiana",
    state: "Punjab",
    distance: "14.5 km away",
    bays: 8,
    baseWaitMinutes: 24,
    contactNumber: "0161-277101",
    recommended: true,
    acceptedCrops: ["Wheat", "Paddy / Rice", "Maize"],
    agencyType: "APMC",
    operatingHours: "08:30 AM – 06:30 PM",
    storageCapacityMT: 150000,
    bayCapacityPerSlot: 6,
  },
  {
    id: "centre-ludhiana-sahnewal",
    name: "Sahnewal Modern Grain Terminal",
    location: "Ludhiana",
    state: "Punjab",
    distance: "7.2 km away",
    bays: 6,
    baseWaitMinutes: 20,
    contactNumber: "0161-277102",
    acceptedCrops: ["Wheat", "Paddy / Rice"],
    agencyType: "FCI",
    operatingHours: "09:00 AM – 06:00 PM",
    storageCapacityMT: 90000,
    bayCapacityPerSlot: 5,
  },
  {
    id: "centre-ludhiana-jagraon",
    name: "Jagraon APMC Market",
    location: "Ludhiana",
    state: "Punjab",
    distance: "23.0 km away",
    bays: 5,
    baseWaitMinutes: 22,
    contactNumber: "0161-277103",
    acceptedCrops: ["Wheat", "Paddy / Rice", "Maize"],
    agencyType: "APMC",
    operatingHours: "09:00 AM – 05:30 PM",
    storageCapacityMT: 45000,
    bayCapacityPerSlot: 4,
  },

  // =========================================================================
  // 25. Nagpur (Maharashtra) — Vidarbha Cotton & Pulse Hub
  // =========================================================================
  {
    id: "centre-nagpur-cotton-apmc",
    name: "Nagpur Cotton & Grain APMC",
    location: "Nagpur",
    state: "Maharashtra",
    distance: "4.5 km away",
    bays: 6,
    baseWaitMinutes: 24,
    contactNumber: "0712-273101",
    recommended: true,
    acceptedCrops: ["Cotton", "Soybean", "Gram", "Arhar / Tur", "Wheat"],
    agencyType: "APMC",
    operatingHours: "09:00 AM – 06:00 PM",
    storageCapacityMT: 60000,
    bayCapacityPerSlot: 5,
  },
  {
    id: "centre-nagpur-saoner-cci",
    name: "Saoner CCI Cotton Procurement Centre",
    location: "Nagpur",
    state: "Maharashtra",
    distance: "17.0 km away",
    bays: 5,
    baseWaitMinutes: 18,
    contactNumber: "0712-273102",
    acceptedCrops: ["Cotton"],
    agencyType: "CCI",
    operatingHours: "08:30 AM – 06:00 PM",
    storageCapacityMT: 35000,
    bayCapacityPerSlot: 4,
  },
  {
    id: "centre-nagpur-katol-nafed",
    name: "Katol NAFED Pulse Procurement Complex",
    location: "Nagpur",
    state: "Maharashtra",
    distance: "22.5 km away",
    bays: 4,
    baseWaitMinutes: 20,
    contactNumber: "0712-273103",
    acceptedCrops: ["Arhar / Tur", "Gram", "Soybean", "Urad"],
    agencyType: "NAFED",
    operatingHours: "09:30 AM – 05:00 PM",
    storageCapacityMT: 25000,
    bayCapacityPerSlot: 3,
  },

  // =========================================================================
  // 26. Akola (Maharashtra) — Cotton City of Vidarbha
  // =========================================================================
  {
    id: "centre-akola-cotton-apmc",
    name: "Akola Cotton City APMC",
    location: "Akola",
    state: "Maharashtra",
    distance: "3.2 km away",
    bays: 6,
    baseWaitMinutes: 20,
    contactNumber: "0724-243101",
    recommended: true,
    acceptedCrops: ["Cotton", "Soybean", "Arhar / Tur", "Urad", "Moong"],
    agencyType: "APMC",
    operatingHours: "09:00 AM – 06:00 PM",
    storageCapacityMT: 55000,
    bayCapacityPerSlot: 5,
  },
  {
    id: "centre-akola-murtizapur-cci",
    name: "Murtizapur CCI Cotton Complex",
    location: "Akola",
    state: "Maharashtra",
    distance: "16.8 km away",
    bays: 5,
    baseWaitMinutes: 16,
    contactNumber: "0724-243102",
    acceptedCrops: ["Cotton", "Soybean"],
    agencyType: "CCI",
    operatingHours: "08:30 AM – 06:00 PM",
    storageCapacityMT: 35000,
    bayCapacityPerSlot: 4,
  },

  // =========================================================================
  // 27. Meerut (Uttar Pradesh)
  // =========================================================================
  {
    id: "centre-meerut-central",
    name: "Meerut Central Krishi Mandi",
    location: "Meerut",
    state: "Uttar Pradesh",
    distance: "4.6 km away",
    bays: 6,
    baseWaitMinutes: 28,
    contactNumber: "0121-277101",
    recommended: true,
    acceptedCrops: ["Wheat", "Paddy / Rice", "Mustard", "Maize"],
    agencyType: "APMC",
    operatingHours: "09:00 AM – 05:30 PM",
    storageCapacityMT: 50000,
    bayCapacityPerSlot: 4,
  },
  {
    id: "centre-meerut-mawana",
    name: "Mawana Sugar & Grain Hub",
    location: "Meerut",
    state: "Uttar Pradesh",
    distance: "14.2 km away",
    bays: 4,
    baseWaitMinutes: 20,
    contactNumber: "0121-277102",
    acceptedCrops: ["Wheat", "Paddy / Rice", "Mustard"],
    agencyType: "APMC",
    operatingHours: "09:30 AM – 05:00 PM",
    storageCapacityMT: 30000,
    bayCapacityPerSlot: 3,
  },
];

// =========================================================================
// HELPER FUNCTIONS & COMPATIBILITY CHECKERS
// =========================================================================

export function centreAcceptsCrop(centre: ProcurementCentre, cropName?: string): boolean {
  if (!cropName) return true;
  if (!centre.acceptedCrops || centre.acceptedCrops.length === 0) return true;
  const normTarget = normalizeCropName(cropName);
  return centre.acceptedCrops.some((c) => normalizeCropName(c) === normTarget);
}

export function centreAcceptsAllCrops(centre: ProcurementCentre, cropNames: string[]): boolean {
  if (!cropNames || cropNames.length === 0) return true;
  return cropNames.every((crop) => centreAcceptsCrop(centre, crop));
}

export function centreCropCompatibility(
  centre: ProcurementCentre,
  cropNames: string[]
): {
  accepted: string[];
  unaccepted: string[];
  isFullyCompatible: boolean;
  isPartiallyCompatible: boolean;
  matchPercentage: number;
} {
  if (!cropNames || cropNames.length === 0) {
    return {
      accepted: [],
      unaccepted: [],
      isFullyCompatible: true,
      isPartiallyCompatible: true,
      matchPercentage: 100,
    };
  }

  const accepted: string[] = [];
  const unaccepted: string[] = [];

  cropNames.forEach((crop) => {
    if (centreAcceptsCrop(centre, crop)) {
      accepted.push(crop);
    } else {
      unaccepted.push(crop);
    }
  });

  const matchPercentage = Math.round((accepted.length / cropNames.length) * 100);

  return {
    accepted,
    unaccepted,
    isFullyCompatible: unaccepted.length === 0,
    isPartiallyCompatible: accepted.length > 0,
    matchPercentage,
  };
}

export function getCentresByLocation(locationName?: string): ProcurementCentre[] {
  if (!locationName || locationName === "All") {
    return PROCUREMENT_CENTRES;
  }
  const clean = locationName.toLowerCase().trim();
  const matched = PROCUREMENT_CENTRES.filter(
    (c) =>
      c.location.toLowerCase().includes(clean) ||
      clean.includes(c.location.toLowerCase()) ||
      c.id.toLowerCase().includes(clean)
  );
  return matched.length > 0 ? matched : PROCUREMENT_CENTRES.slice(0, 4);
}

export function getCentresByLocationAndCrops(
  locationName: string | undefined,
  cropNames: string[]
): ProcurementCentre[] {
  const centres = getCentresByLocation(locationName);
  if (!cropNames || cropNames.length === 0) return centres;

  // Sort by compatibility: fully compatible first, partially next, incompatible last
  return [...centres].sort((a, b) => {
    const compA = centreCropCompatibility(a, cropNames);
    const compB = centreCropCompatibility(b, cropNames);
    return compB.matchPercentage - compA.matchPercentage;
  });
}

export function getAllLocations(): LocationOption[] {
  return LOCATIONS_DATA;
}

export function getAllCentres(): ProcurementCentre[] {
  return PROCUREMENT_CENTRES;
}

export function getCentreByName(centreName?: string): ProcurementCentre | undefined {
  if (!centreName) return undefined;
  const clean = centreName.toLowerCase().trim();
  return PROCUREMENT_CENTRES.find(
    (c) =>
      c.name.toLowerCase() === clean ||
      c.name.toLowerCase().includes(clean) ||
      c.id.toLowerCase() === clean
  );
}

// =========================================================================
// GEOSPATIAL DISTANCE & NEAREST CENTRE CALCULATIONS
// =========================================================================

/**
 * Haversine formula to compute great-circle distance between two GPS coordinates in kilometers.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getLocationCoordinates(
  locationName?: string
): { latitude: number; longitude: number } | null {
  if (!locationName) return null;
  const clean = locationName.toLowerCase().trim();
  const matched = LOCATIONS_DATA.find(
    (l) => l.name.toLowerCase() === clean || clean.includes(l.name.toLowerCase()) || l.id === clean
  );
  if (matched) {
    return { latitude: matched.latitude, longitude: matched.longitude };
  }
  return null;
}

export function getDistanceBetweenDistricts(
  fromDistrict: string,
  toDistrict: string
): number {
  if (!fromDistrict || !toDistrict) return 0;
  if (fromDistrict.toLowerCase().trim() === toDistrict.toLowerCase().trim()) return 0;

  const c1 = getLocationCoordinates(fromDistrict);
  const c2 = getLocationCoordinates(toDistrict);
  if (!c1 || !c2) return 50; // fallback estimated inter-district distance

  const straightLine = calculateHaversineDistanceKm(
    c1.latitude,
    c1.longitude,
    c2.latitude,
    c2.longitude
  );
  // Realistic road winding factor (1.25)
  return Math.round(straightLine * 1.25 * 10) / 10;
}

export function getEffectiveDistanceToCentre(
  fromDistrict: string,
  centre: ProcurementCentre
): {
  distanceKm: number;
  distanceFormatted: string;
  isCrossDistrict: boolean;
} {
  const localDist = parseFloat(centre.distance) || 4.5;
  const isSameDistrict =
    fromDistrict.toLowerCase().trim() === centre.location.toLowerCase().trim();

  if (isSameDistrict) {
    return {
      distanceKm: localDist,
      distanceFormatted: `${localDist.toFixed(1)} km away`,
      isCrossDistrict: false,
    };
  }

  const interDistrictRoadKm = getDistanceBetweenDistricts(fromDistrict, centre.location);
  const totalKm = Math.round((interDistrictRoadKm + localDist) * 10) / 10;

  return {
    distanceKm: totalKm,
    distanceFormatted: `${totalKm.toFixed(1)} km away (${centre.location})`,
    isCrossDistrict: true,
  };
}

export interface NearestCentreResult extends ProcurementCentre {
  calculatedDistanceKm: number;
  distanceFormatted: string;
  isCrossDistrict: boolean;
  compatibility: {
    accepted: string[];
    unaccepted: string[];
    isFullyCompatible: boolean;
    isPartiallyCompatible: boolean;
    matchPercentage: number;
  };
}

/**
 * Returns procurement centres that ACTUALLY accept the specified crop(s),
 * sorted ascending by distance from the specified district (nearest first).
 */
export function findNearestCentresForCrops(
  crops: string[],
  fromDistrict: string = "Bhopal",
  limit: number = 6
): NearestCentreResult[] {
  const cleanCrops = (crops || []).filter(Boolean);

  if (cleanCrops.length === 0) {
    const local = getCentresByLocation(fromDistrict);
    return local.map((c) => {
      const eff = getEffectiveDistanceToCentre(fromDistrict, c);
      return {
        ...c,
        calculatedDistanceKm: eff.distanceKm,
        distanceFormatted: eff.distanceFormatted,
        isCrossDistrict: eff.isCrossDistrict,
        compatibility: {
          accepted: [],
          unaccepted: [],
          isFullyCompatible: true,
          isPartiallyCompatible: true,
          matchPercentage: 100,
        },
      };
    });
  }

  // Filter centres that accept AT LEAST ONE of the requested crops
  const candidates: NearestCentreResult[] = [];

  for (const centre of PROCUREMENT_CENTRES) {
    const comp = centreCropCompatibility(centre, cleanCrops);
    if (comp.accepted.length > 0) {
      const eff = getEffectiveDistanceToCentre(fromDistrict, centre);
      candidates.push({
        ...centre,
        calculatedDistanceKm: eff.distanceKm,
        distanceFormatted: eff.distanceFormatted,
        isCrossDistrict: eff.isCrossDistrict,
        compatibility: comp,
      });
    }
  }

  // Sort: Fully compatible first (100%), then by calculated distance ascending
  candidates.sort((a, b) => {
    if (a.compatibility.isFullyCompatible !== b.compatibility.isFullyCompatible) {
      return a.compatibility.isFullyCompatible ? -1 : 1;
    }
    return a.calculatedDistanceKm - b.calculatedDistanceKm;
  });

  return candidates.slice(0, limit);
}

