export type CropGrade = "Grade A" | "Grade B" | "Grade C" | "Grade D";

export type CropCategory = "Cereal" | "Oilseed" | "Pulse" | "Commercial";

export interface GradeDetail {
  price: number; // in Rs./quintal (₹/quintal)
  label: string;
  specs: string;
}

export interface CropMspRate {
  id: string;
  name: string;
  nameHi: string;
  category: CropCategory;
  unit: "quintal";
  standardMsp: number; // Base benchmark rate
  grades: Record<CropGrade, GradeDetail>;
}

export const CROP_MSP_RATES: CropMspRate[] = [
  {
    id: "wheat",
    name: "Wheat",
    nameHi: "गेहूं",
    category: "Cereal",
    unit: "quintal",
    standardMsp: 2425,
    grades: {
      "Grade A": {
        price: 2425,
        label: "Premium Lustrous / Sharbati",
        specs: "Moisture < 12%, Foreign matter < 0.75%, Broken < 2%",
      },
      "Grade B": {
        price: 2275,
        label: "Standard Milling",
        specs: "Moisture 12–13%, Foreign matter < 1.5%, Broken < 4%",
      },
      "Grade C": {
        price: 2150,
        label: "Feed / Commercial Grade",
        specs: "Moisture 13–14%, Foreign matter < 2.5%, Slightly discolored",
      },
      "Grade D": {
        price: 2000,
        label: "Industrial / Distillation",
        specs: "Moisture 14–15%, Foreign matter > 2.5%, Damaged grains allowed up to 6%",
      },
    },
  },
  {
    id: "paddy",
    name: "Paddy / Rice",
    nameHi: "धान / चावल",
    category: "Cereal",
    unit: "quintal",
    standardMsp: 2320,
    grades: {
      "Grade A": {
        price: 2320,
        label: "Grade A (Fine / Long Grain)",
        specs: "Moisture < 17%, Foreign matter < 1%, Slender aromatic/fine grain",
      },
      "Grade B": {
        price: 2300,
        label: "Common (Medium Grain)",
        specs: "Moisture < 17%, Foreign matter < 1.5%, Medium bold grain",
      },
      "Grade C": {
        price: 2150,
        label: "Coarse / Standard",
        specs: "Moisture 17–18%, Broken up to 5%, Foreign matter < 2%",
      },
      "Grade D": {
        price: 1980,
        label: "Sub-standard / Feed",
        specs: "Moisture 18–19%, High broken content up to 10%",
      },
    },
  },
  {
    id: "mustard",
    name: "Mustard",
    nameHi: "सरसों / राई",
    category: "Oilseed",
    unit: "quintal",
    standardMsp: 5950,
    grades: {
      "Grade A": {
        price: 5950,
        label: "Bold Seed (High Oil > 42%)",
        specs: "Moisture < 8%, Oil content ≥ 42%, Impurities < 1%",
      },
      "Grade B": {
        price: 5650,
        label: "Standard Seed (Oil 38–41%)",
        specs: "Moisture 8–9%, Oil content 38–41%, Impurities < 2%",
      },
      "Grade C": {
        price: 5200,
        label: "Medium Bold (Oil 35–37%)",
        specs: "Moisture 9–10%, Oil content 35–37%, Impurities < 3%",
      },
      "Grade D": {
        price: 4800,
        label: "Mixed / Low Oil (< 35%)",
        specs: "Moisture 10–12%, Small/shriveled seeds, High chaff",
      },
    },
  },
  {
    id: "gram",
    name: "Gram / Chana",
    nameHi: "चना",
    category: "Pulse",
    unit: "quintal",
    standardMsp: 5650,
    grades: {
      "Grade A": {
        price: 5650,
        label: "Bold Kabuli / Desi Grade 1",
        specs: "Moisture < 10%, Foreign matter < 1%, Zero insect infestation",
      },
      "Grade B": {
        price: 5440,
        label: "Desi Medium (FAQ)",
        specs: "Moisture 10–11%, Foreign matter < 1.5%, Broken < 3%",
      },
      "Grade C": {
        price: 5100,
        label: "Small Grain Chana",
        specs: "Moisture 11–12%, Broken 3–5%, Foreign matter < 2.5%",
      },
      "Grade D": {
        price: 4700,
        label: "Split / Discolored (Dal Grade)",
        specs: "Moisture > 12%, Split/chipped grains > 6%",
      },
    },
  },
  {
    id: "soybean",
    name: "Soybean",
    nameHi: "सोयाबीन",
    category: "Oilseed",
    unit: "quintal",
    standardMsp: 5100,
    grades: {
      "Grade A": {
        price: 5100,
        label: "Yellow Premium (Oil > 19%)",
        specs: "Moisture < 10%, Oil content ≥ 19%, Foreign matter < 1%",
      },
      "Grade B": {
        price: 4892,
        label: "Standard Yellow (FAQ)",
        specs: "Moisture 10–12%, Oil content 18–19%, Foreign matter < 2%",
      },
      "Grade C": {
        price: 4500,
        label: "Commercial Crushing",
        specs: "Moisture 12–13%, Slight greenish/shriveled grains < 5%",
      },
      "Grade D": {
        price: 4100,
        label: "Feed Grade",
        specs: "Moisture 13–14%, Foreign matter > 3%, High splits",
      },
    },
  },
  {
    id: "maize",
    name: "Maize",
    nameHi: "मक्का",
    category: "Cereal",
    unit: "quintal",
    standardMsp: 2225,
    grades: {
      "Grade A": {
        price: 2225,
        label: "Yellow Flint Premium",
        specs: "Moisture < 14%, Foreign matter < 1%, Aflatoxin clean",
      },
      "Grade B": {
        price: 2090,
        label: "Yellow Standard (FAQ)",
        specs: "Moisture 14–15%, Foreign matter < 2%, Broken < 3%",
      },
      "Grade C": {
        price: 1950,
        label: "Starch / Poultry Grade",
        specs: "Moisture 15–16%, Slight discolored grains < 4%",
      },
      "Grade D": {
        price: 1800,
        label: "Feed Mixed",
        specs: "Moisture 16–17%, High moisture/broken > 5%",
      },
    },
  },
  {
    id: "cotton",
    name: "Cotton",
    nameHi: "कपास",
    category: "Commercial",
    unit: "quintal",
    standardMsp: 7521,
    grades: {
      "Grade A": {
        price: 7521,
        label: "Long Staple (29.5–30.5mm)",
        specs: "Moisture < 8%, Trash < 3%, High micronaire & tensile strength",
      },
      "Grade B": {
        price: 7121,
        label: "Medium Staple (26.5–28.5mm)",
        specs: "Moisture 8–9%, Trash < 4%, Standard white fiber",
      },
      "Grade C": {
        price: 6600,
        label: "Short Staple / Tinged",
        specs: "Moisture 9–10%, Trash 4–6%, Slightly yellowish tint",
      },
      "Grade D": {
        price: 6100,
        label: "Coarse / Low Grade",
        specs: "Moisture > 10%, Trash > 6%, Stained fibers",
      },
    },
  },
  {
    id: "barley",
    name: "Barley",
    nameHi: "जौ",
    category: "Cereal",
    unit: "quintal",
    standardMsp: 2050,
    grades: {
      "Grade A": {
        price: 2050,
        label: "Two-Row Malting Premium",
        specs: "Moisture < 12%, Plump grain > 90%, High germination",
      },
      "Grade B": {
        price: 1850,
        label: "Six-Row Standard (FAQ)",
        specs: "Moisture 12–13%, Plump grain > 80%, Foreign matter < 2%",
      },
      "Grade C": {
        price: 1700,
        label: "Commercial Milling",
        specs: "Moisture 13–14%, Broken < 4%, Foreign matter < 3%",
      },
      "Grade D": {
        price: 1550,
        label: "Feed Barley",
        specs: "Moisture 14–15%, Thin/pinched grains allowed",
      },
    },
  },
];

export function normalizeCropName(cropStr?: string): string {
  if (!cropStr) return "wheat";
  const clean = cropStr.toLowerCase().trim();
  if (clean.includes("wheat") || clean.includes("गेहूं")) return "wheat";
  if (clean.includes("paddy") || clean.includes("rice") || clean.includes("धान") || clean.includes("चावल")) return "paddy";
  if (clean.includes("mustard") || clean.includes("sarson") || clean.includes("सरसों") || clean.includes("राई")) return "mustard";
  if (clean.includes("gram") || clean.includes("chana") || clean.includes("चना")) return "gram";
  if (clean.includes("soybean") || clean.includes("soya") || clean.includes("सोयाबीन")) return "soybean";
  if (clean.includes("maize") || clean.includes("makka") || clean.includes("मक्का") || clean.includes("corn")) return "maize";
  if (clean.includes("cotton") || clean.includes("kapas") || clean.includes("कपास")) return "cotton";
  if (clean.includes("barley") || clean.includes("jau") || clean.includes("जौ")) return "barley";
  return "wheat";
}

export function getCropMspData(cropStr?: string): CropMspRate {
  const normId = normalizeCropName(cropStr);
  return (
    CROP_MSP_RATES.find((item) => item.id === normId) || CROP_MSP_RATES[0]
  );
}

export function getMspRate(cropStr?: string, grade: CropGrade = "Grade A"): number {
  const data = getCropMspData(cropStr);
  return data.grades[grade]?.price ?? data.standardMsp;
}

export function calculatePayout(
  cropStr: string | undefined,
  grade: CropGrade = "Grade A",
  quantityInQuintals: number = 0
): {
  ratePerQuintal: number;
  quantityQuintals: number;
  totalPayout: number;
  cropName: string;
  gradeLabel: string;
} {
  const data = getCropMspData(cropStr);
  const gradeDetail = data.grades[grade] || data.grades["Grade A"];
  const ratePerQuintal = gradeDetail.price;
  const safeQty = Math.max(0, Number(quantityInQuintals) || 0);
  const totalPayout = Math.round(safeQty * ratePerQuintal);

  return {
    ratePerQuintal,
    quantityQuintals: safeQty,
    totalPayout,
    cropName: data.name,
    gradeLabel: gradeDetail.label,
  };
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
