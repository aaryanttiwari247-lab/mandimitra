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
}

export interface LocationOption {
  id: string;
  name: string;
  state: string;
  centresCount: number;
}

export const LOCATIONS_DATA: LocationOption[] = [
  { id: "bhopal", name: "Bhopal", state: "Madhya Pradesh", centresCount: 3 },
  { id: "sehore", name: "Sehore", state: "Madhya Pradesh", centresCount: 3 },
  { id: "narmadapuram", name: "Narmadapuram", state: "Madhya Pradesh", centresCount: 3 },
  { id: "raisen", name: "Raisen", state: "Madhya Pradesh", centresCount: 3 },
  { id: "vidisha", name: "Vidisha", state: "Madhya Pradesh", centresCount: 3 },
  { id: "indore", name: "Indore", state: "Madhya Pradesh", centresCount: 3 },
  { id: "ujjain", name: "Ujjain", state: "Madhya Pradesh", centresCount: 3 },
  { id: "dewas", name: "Dewas", state: "Madhya Pradesh", centresCount: 3 },
  { id: "sagar", name: "Sagar", state: "Madhya Pradesh", centresCount: 3 },
  { id: "jabalpur", name: "Jabalpur", state: "Madhya Pradesh", centresCount: 3 },
  { id: "gwalior", name: "Gwalior", state: "Madhya Pradesh", centresCount: 2 },
  { id: "kota", name: "Kota", state: "Rajasthan", centresCount: 2 },
  { id: "jaipur", name: "Jaipur", state: "Rajasthan", centresCount: 2 },
  { id: "karnal", name: "Karnal", state: "Haryana", centresCount: 2 },
  { id: "meerut", name: "Meerut", state: "Uttar Pradesh", centresCount: 2 },
];

export const PROCUREMENT_CENTRES: ProcurementCentre[] = [
  // 1. Bhopal (Preserving Lakshmipur & Rampur for backward compatibility)
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
  },

  // 2. Sehore (Preserving Shivpur)
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
  },
  {
    id: "centre-sehore-ashta",
    name: "Ashta Grain & Oilseed Centre",
    location: "Sehore",
    state: "Madhya Pradesh",
    distance: "12.4 km away",
    bays: 4,
    baseWaitMinutes: 20,
    contactNumber: "07562-224103",
  },

  // 3. Narmadapuram / Hoshangabad
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
  },
  {
    id: "centre-narmada-itarsi",
    name: "Itarsi Railway Junction Mandi",
    location: "Narmadapuram",
    state: "Madhya Pradesh",
    distance: "8.5 km away",
    bays: 6,
    baseWaitMinutes: 35,
    contactNumber: "07574-252102",
  },
  {
    id: "centre-narmada-pipariya",
    name: "Pipariya Wheat & Pulse Complex",
    location: "Narmadapuram",
    state: "Madhya Pradesh",
    distance: "15.0 km away",
    bays: 4,
    baseWaitMinutes: 18,
    contactNumber: "07574-252103",
  },

  // 4. Raisen
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
  },
  {
    id: "centre-raisen-gairatganj",
    name: "Gairatganj Procurement Yard",
    location: "Raisen",
    state: "Madhya Pradesh",
    distance: "14.2 km away",
    bays: 3,
    baseWaitMinutes: 25,
    contactNumber: "07482-222102",
  },
  {
    id: "centre-raisen-begumganj",
    name: "Begumganj Agro Hub",
    location: "Raisen",
    state: "Madhya Pradesh",
    distance: "18.6 km away",
    bays: 3,
    baseWaitMinutes: 15,
    contactNumber: "07482-222103",
  },

  // 5. Vidisha
  {
    id: "centre-vidisha-sharbati",
    name: "Vidisha Sharbati Wheat Centre",
    location: "Vidisha",
    state: "Madhya Pradesh",
    distance: "3.5 km away",
    bays: 6,
    baseWaitMinutes: 20,
    contactNumber: "07592-233101",
    recommended: true,
  },
  {
    id: "centre-vidisha-basoda",
    name: "Ganj Basoda Grain Mandi",
    location: "Vidisha",
    state: "Madhya Pradesh",
    distance: "11.0 km away",
    bays: 5,
    baseWaitMinutes: 30,
    contactNumber: "07592-233102",
  },
  {
    id: "centre-vidisha-kurwai",
    name: "Kurwai Gram & Mustard Terminal",
    location: "Vidisha",
    state: "Madhya Pradesh",
    distance: "19.5 km away",
    bays: 3,
    baseWaitMinutes: 15,
    contactNumber: "07592-233103",
  },

  // 6. Indore
  {
    id: "centre-indore-choithram",
    name: "Choithram Krishi Upaj Mandi",
    location: "Indore",
    state: "Madhya Pradesh",
    distance: "4.5 km away",
    bays: 8,
    baseWaitMinutes: 30,
    contactNumber: "0731-255101",
    recommended: true,
  },
  {
    id: "centre-indore-sanwer",
    name: "Sanwer Soy & Wheat Centre",
    location: "Indore",
    state: "Madhya Pradesh",
    distance: "9.2 km away",
    bays: 4,
    baseWaitMinutes: 20,
    contactNumber: "0731-255102",
  },
  {
    id: "centre-indore-mhow",
    name: "Mhow Integrated Agro Terminal",
    location: "Indore",
    state: "Madhya Pradesh",
    distance: "12.8 km away",
    bays: 4,
    baseWaitMinutes: 25,
    contactNumber: "0731-255103",
  },

  // 7. Ujjain
  {
    id: "centre-ujjain-chimanganj",
    name: "Chimanganj Mandi Complex",
    location: "Ujjain",
    state: "Madhya Pradesh",
    distance: "3.0 km away",
    bays: 7,
    baseWaitMinutes: 25,
    contactNumber: "0734-251101",
    recommended: true,
  },
  {
    id: "centre-ujjain-nagda",
    name: "Nagda Agro Processing Centre",
    location: "Ujjain",
    state: "Madhya Pradesh",
    distance: "14.5 km away",
    bays: 4,
    baseWaitMinutes: 20,
    contactNumber: "0734-251102",
  },
  {
    id: "centre-ujjain-mahidpur",
    name: "Mahidpur Pulse & Cereal Yard",
    location: "Ujjain",
    state: "Madhya Pradesh",
    distance: "18.0 km away",
    bays: 3,
    baseWaitMinutes: 15,
    contactNumber: "0734-251103",
  },

  // 8. Dewas
  {
    id: "centre-dewas-industrial",
    name: "Dewas Industrial Krishi Mandi",
    location: "Dewas",
    state: "Madhya Pradesh",
    distance: "3.7 km away",
    bays: 5,
    baseWaitMinutes: 25,
    contactNumber: "07272-255101",
    recommended: true,
  },
  {
    id: "centre-dewas-sonkatch",
    name: "Sonkatch Soybean Procurement Centre",
    location: "Dewas",
    state: "Madhya Pradesh",
    distance: "11.5 km away",
    bays: 4,
    baseWaitMinutes: 20,
    contactNumber: "07272-255102",
  },
  {
    id: "centre-dewas-bagli",
    name: "Bagli Agro Farmer Hub",
    location: "Dewas",
    state: "Madhya Pradesh",
    distance: "16.2 km away",
    bays: 3,
    baseWaitMinutes: 15,
    contactNumber: "07272-255103",
  },

  // 9. Sagar
  {
    id: "centre-sagar-central",
    name: "Sagar Central Grain Terminal",
    location: "Sagar",
    state: "Madhya Pradesh",
    distance: "4.2 km away",
    bays: 5,
    baseWaitMinutes: 25,
    contactNumber: "07582-244101",
    recommended: true,
  },
  {
    id: "centre-sagar-bina",
    name: "Bina Mustard & Wheat Centre",
    location: "Sagar",
    state: "Madhya Pradesh",
    distance: "15.0 km away",
    bays: 4,
    baseWaitMinutes: 20,
    contactNumber: "07582-244102",
  },
  {
    id: "centre-sagar-banda",
    name: "Banda Agro Procurement Yard",
    location: "Sagar",
    state: "Madhya Pradesh",
    distance: "17.4 km away",
    bays: 3,
    baseWaitMinutes: 18,
    contactNumber: "07582-244103",
  },

  // 10. Jabalpur
  {
    id: "centre-jabalpur-main",
    name: "Jabalpur Krishi Upaj Mandi",
    location: "Jabalpur",
    state: "Madhya Pradesh",
    distance: "4.8 km away",
    bays: 6,
    baseWaitMinutes: 28,
    contactNumber: "0761-266101",
    recommended: true,
  },
  {
    id: "centre-jabalpur-patan",
    name: "Patan Green Pea & Wheat Centre",
    location: "Jabalpur",
    state: "Madhya Pradesh",
    distance: "12.0 km away",
    bays: 4,
    baseWaitMinutes: 20,
    contactNumber: "0761-266102",
  },
  {
    id: "centre-jabalpur-sihora",
    name: "Sihora Grain Mandi Terminal",
    location: "Jabalpur",
    state: "Madhya Pradesh",
    distance: "16.8 km away",
    bays: 3,
    baseWaitMinutes: 15,
    contactNumber: "0761-266103",
  },

  // 11. Gwalior
  {
    id: "centre-gwalior-laxmiganj",
    name: "Laxmiganj Krishi Mandi",
    location: "Gwalior",
    state: "Madhya Pradesh",
    distance: "3.6 km away",
    bays: 6,
    baseWaitMinutes: 25,
    contactNumber: "0751-244101",
    recommended: true,
  },
  {
    id: "centre-gwalior-dabra",
    name: "Dabra Mustard & Paddy Yard",
    location: "Gwalior",
    state: "Madhya Pradesh",
    distance: "14.0 km away",
    bays: 5,
    baseWaitMinutes: 22,
    contactNumber: "0751-244102",
  },

  // 12. Kota
  {
    id: "centre-kota-bhamashah",
    name: "Bhamashah Krishi Upaj Mandi",
    location: "Kota",
    state: "Rajasthan",
    distance: "4.1 km away",
    bays: 8,
    baseWaitMinutes: 30,
    contactNumber: "0744-233101",
    recommended: true,
  },
  {
    id: "centre-kota-ramganj",
    name: "Ramganj Mandi Coriander & Soy Hub",
    location: "Kota",
    state: "Rajasthan",
    distance: "16.5 km away",
    bays: 5,
    baseWaitMinutes: 20,
    contactNumber: "0744-233102",
  },

  // 13. Jaipur
  {
    id: "centre-jaipur-surajpole",
    name: "Surajpole Grain Mandi",
    location: "Jaipur",
    state: "Rajasthan",
    distance: "5.0 km away",
    bays: 7,
    baseWaitMinutes: 30,
    contactNumber: "0141-266101",
    recommended: true,
  },
  {
    id: "centre-jaipur-chomu",
    name: "Chomu Mustard & Bajra Centre",
    location: "Jaipur",
    state: "Rajasthan",
    distance: "13.2 km away",
    bays: 4,
    baseWaitMinutes: 20,
    contactNumber: "0141-266102",
  },

  // 14. Karnal
  {
    id: "centre-karnal-basmati",
    name: "Karnal Basmati & Wheat Centre",
    location: "Karnal",
    state: "Haryana",
    distance: "3.4 km away",
    bays: 7,
    baseWaitMinutes: 25,
    contactNumber: "0184-225101",
    recommended: true,
  },
  {
    id: "centre-karnal-gharaunda",
    name: "Gharaunda Grain Terminal",
    location: "Karnal",
    state: "Haryana",
    distance: "11.8 km away",
    bays: 4,
    baseWaitMinutes: 18,
    contactNumber: "0184-225102",
  },

  // 15. Meerut
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
  },
];

export function getCentresByLocation(locationName?: string): ProcurementCentre[] {
  if (!locationName || locationName === "All") {
    return PROCUREMENT_CENTRES;
  }
  const clean = locationName.toLowerCase().trim();
  const matched = PROCUREMENT_CENTRES.filter(
    (c) => c.location.toLowerCase().includes(clean) || clean.includes(c.location.toLowerCase())
  );
  return matched.length > 0 ? matched : PROCUREMENT_CENTRES.slice(0, 3);
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
    (c) => c.name.toLowerCase() === clean || c.name.toLowerCase().includes(clean)
  );
}
