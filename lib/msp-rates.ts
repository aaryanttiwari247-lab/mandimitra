export type CropGrade = "Grade A" | "Grade B" | "Grade C" | "Grade D";

export type CropCategory = "Cereal" | "Oilseed" | "Pulse" | "Commercial";

export interface GradeDetail {
  price: number; // in Rs./quintal (₹/quintal)
  label: string;
  labelHi?: string;
  labelBn?: string;
  specs: string;
  specsHi?: string;
  specsBn?: string;
}

export interface CropMspRate {
  id: string;
  name: string;
  nameHi: string;
  nameBn: string;
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
    nameBn: "গম",
    category: "Cereal",
    unit: "quintal",
    standardMsp: 2425,
    grades: {
      "Grade A": {
        price: 2425,
        label: "Premium Lustrous / Sharbati",
        labelHi: "प्रीमियम चमकदार / शरबती",
        labelBn: "প্রিমিয়াম চকচকে / সর্বতী",
        specs: "Moisture < 12%, Foreign matter < 0.75%, Broken < 2%",
        specsHi: "नमी < 12%, बाहरी तत्व < 0.75%, टूटे दाने < 2%",
        specsBn: "আর্দ্রতা < ১২%, অপদ্রব্য < ০.৭৫%, ভাঙা দানা < ২%",
      },
      "Grade B": {
        price: 2275,
        label: "Standard Milling",
        labelHi: "मानक मिलिंग (FAQ)",
        labelBn: "স্ট্যান্ডার্ড মিলিং (FAQ)",
        specs: "Moisture 12–13%, Foreign matter < 1.5%, Broken < 4%",
        specsHi: "नमी 12–13%, बाहरी तत्व < 1.5%, टूटे दाने < 4%",
        specsBn: "আর্দ্রতা ১২–১৩%, অপদ্রব্য < ১.৫%, ভাঙা দানা < ৪%",
      },
      "Grade C": {
        price: 2150,
        label: "Feed / Commercial Grade",
        labelHi: "चारा / व्यावसायिक ग्रेड",
        labelBn: "পশুখাদ্য / বাণিজ্যিক গ্রেড",
        specs: "Moisture 13–14%, Foreign matter < 2.5%, Slightly discolored",
        specsHi: "नमी 13–14%, बाहरी तत्व < 2.5%, थोड़ा फीका रंग",
        specsBn: "আর্দ্রতা ১৩–১৪%, অপদ্রব্য < ২.৫%, সামান্য বিবর্ণ",
      },
      "Grade D": {
        price: 2000,
        label: "Industrial / Distillation",
        labelHi: "औद्योगिक / आसवन ग्रेड",
        labelBn: "শিল্প / পাতন গ্রেড",
        specs: "Moisture 14–15%, Foreign matter > 2.5%, Damaged grains allowed up to 6%",
        specsHi: "नमी 14–15%, बाहरी तत्व > 2.5%, क्षतिग्रस्त दाने 6% तक",
        specsBn: "আর্দ্রতা ১৪–১৫%, অপদ্রব্য > ২.৫%, ক্ষতিগ্রস্ত দানা ৬% পর্যন্ত",
      },
    },
  },
  {
    id: "paddy",
    name: "Paddy / Rice",
    nameHi: "धान / चावल",
    nameBn: "ধান / চাল",
    category: "Cereal",
    unit: "quintal",
    standardMsp: 2320,
    grades: {
      "Grade A": {
        price: 2320,
        label: "Grade A (Fine / Long Grain)",
        labelHi: "ग्रेड A (महीन / बासमती दाना)",
        labelBn: "গ্রেড A (সরু / লম্বা দানা)",
        specs: "Moisture < 17%, Foreign matter < 1%, Slender aromatic/fine grain",
        specsHi: "नमी < 17%, बाहरी तत्व < 1%, पतला सुगंधित/महीन दाना",
        specsBn: "আর্দ্রতা < ১৭%, অপদ্রব্য < ১%, সরু সুগন্ধযুক্ত/সূক্ষ্ম দানা",
      },
      "Grade B": {
        price: 2300,
        label: "Common (Medium Grain)",
        labelHi: "सामान्य (मध्यम दाना FAQ)",
        labelBn: "সাধারণ (মাঝারি দানা FAQ)",
        specs: "Moisture < 17%, Foreign matter < 1.5%, Medium bold grain",
        specsHi: "नमी < 17%, बाहरी तत्व < 1.5%, मध्यम मोटा दाना",
        specsBn: "আর্দ্রতা < ১৭%, অপদ্রব্য < ১.৫%, মাঝারি মোটা দানা",
      },
      "Grade C": {
        price: 2150,
        label: "Coarse / Standard",
        labelHi: "मोटा / मानक ग्रेड",
        labelBn: "মোটা / মানক গ্রেড",
        specs: "Moisture 17–18%, Broken up to 5%, Foreign matter < 2%",
        specsHi: "नमी 17–18%, टूटे दाने 5% तक, बाहरी तत्व < 2%",
        specsBn: "আর্দ্রতা ১৭–১৮%, ভাঙা ৫% পর্যন্ত, অপদ্রব্য < ২%",
      },
      "Grade D": {
        price: 1980,
        label: "Sub-standard / Feed",
        labelHi: "निम्न मानक / चारा",
        labelBn: "নিম্ন মান / পশুখাদ্য",
        specs: "Moisture 18–19%, High broken content up to 10%",
        specsHi: "नमी 18–19%, अधिक टूटे दाने 10% तक",
        specsBn: "আর্দ্রতা ১৮–১৯%, অতিরিক্ত ভাঙা দানা ১০% পর্যন্ত",
      },
    },
  },
  {
    id: "mustard",
    name: "Mustard",
    nameHi: "सरसों / राई",
    nameBn: "সরিষা / রাই",
    category: "Oilseed",
    unit: "quintal",
    standardMsp: 5950,
    grades: {
      "Grade A": {
        price: 5950,
        label: "Bold Seed (High Oil > 42%)",
        labelHi: "मोटा दाना (उच्च तेल > 42%)",
        labelBn: "বোল্ড দানা (উচ্চ তেল > ৪২%)",
        specs: "Moisture < 8%, Oil content ≥ 42%, Impurities < 1%",
        specsHi: "नमी < 8%, तेल मात्रा ≥ 42%, अशुद्धियां < 1%",
        specsBn: "আর্দ্রতা < ৮%, তেলের পরিমাণ ≥ ৪২%, অপদ্রব্য < ১%",
      },
      "Grade B": {
        price: 5650,
        label: "Standard Seed (Oil 38–41%)",
        labelHi: "मानक दाना (तेल 38–41%)",
        labelBn: "স্ট্যান্ডার্ড দানা (তেল ৩৮–৪১%)",
        specs: "Moisture 8–9%, Oil content 38–41%, Impurities < 2%",
        specsHi: "नमी 8–9%, तेल मात्रा 38–41%, अशुद्धियां < 2%",
        specsBn: "আর্দ্রতা ৮–৯%, তেলের পরিমাণ ৩৮–৪১%, অপদ্রব্য < ২%",
      },
      "Grade C": {
        price: 5200,
        label: "Medium Bold (Oil 35–37%)",
        labelHi: "मध्यम दाना (तेल 35–37%)",
        labelBn: "মাঝারি দানা (তেল ৩৫–৩৭%)",
        specs: "Moisture 9–10%, Oil content 35–37%, Impurities < 3%",
        specsHi: "नमी 9–10%, तेल मात्रा 35–37%, अशुद्धियां < 3%",
        specsBn: "আর্দ্রতা ৯–১০%, তেলের পরিমাণ ৩৫–৩৭%, অপদ্রব্য < ৩%",
      },
      "Grade D": {
        price: 4800,
        label: "Mixed / Low Oil (< 35%)",
        labelHi: "मिश्रित / कम तेल (< 35%)",
        labelBn: "মিশ্র / কম তেল (< ৩৫%)",
        specs: "Moisture 10–12%, Small/shriveled seeds, High chaff",
        specsHi: "नमी 10–12%, छोटे/सिकुड़े बीज, अधिक भूसा",
        specsBn: "আর্দ্রতা ১০–১২%, ছোট/কুঁচকানো বীজ, অতিরিক্ত তুষ",
      },
    },
  },
  {
    id: "gram",
    name: "Gram / Chana",
    nameHi: "चना",
    nameBn: "ছোলা / চানা",
    category: "Pulse",
    unit: "quintal",
    standardMsp: 5650,
    grades: {
      "Grade A": {
        price: 5650,
        label: "Bold Kabuli / Desi Grade 1",
        labelHi: "मोटा काबुली / देसी ग्रेड 1",
        labelBn: "বোল্ড কাবুলি / দেশি গ্রেড ১",
        specs: "Moisture < 10%, Foreign matter < 1%, Zero insect infestation",
        specsHi: "नमी < 10%, बाहरी तत्व < 1%, कीट मुक्त",
        specsBn: "আর্দ্রতা < ১০%, অপদ্রব্য < ১%, সম্পূর্ণ পোকা-মুক্ত",
      },
      "Grade B": {
        price: 5440,
        label: "Desi Medium (FAQ)",
        labelHi: "देसी मध्यम (FAQ)",
        labelBn: "দেশি মাঝারি (FAQ)",
        specs: "Moisture 10–11%, Foreign matter < 1.5%, Broken < 3%",
        specsHi: "नमी 10–11%, बाहरी तत्व < 1.5%, टूटे दाने < 3%",
        specsBn: "আর্দ্রতা ১০–১১%, অপদ্রব্য < ১.৫%, ভাঙা < ৩%",
      },
      "Grade C": {
        price: 5100,
        label: "Small Grain Chana",
        labelHi: "छोटा दाना चना",
        labelBn: "ছোট দানার ছোলা",
        specs: "Moisture 11–12%, Broken 3–5%, Foreign matter < 2.5%",
        specsHi: "नमी 11–12%, टूटे 3–5%, बाहरी तत्व < 2.5%",
        specsBn: "আর্দ্রতা ১১–১২%, ভাঙা ৩–৫%, অপদ্রব্য < ২.৫%",
      },
      "Grade D": {
        price: 4700,
        label: "Split / Discolored (Dal Grade)",
        labelHi: "दाल ग्रेड / फीका रंग",
        labelBn: "ডাল গ্রেড / বিবর্ণ",
        specs: "Moisture > 12%, Split/chipped grains > 6%",
        specsHi: "नमी > 12%, कटे/फटे दाने > 6%",
        specsBn: "আর্দ্রতা > ১২%, ফাটা/ভাঙা দানা > ৬%",
      },
    },
  },
  {
    id: "soybean",
    name: "Soybean",
    nameHi: "सोयाबीन",
    nameBn: "সয়াবিন",
    category: "Oilseed",
    unit: "quintal",
    standardMsp: 5100,
    grades: {
      "Grade A": {
        price: 5100,
        label: "Yellow Premium (Oil > 19%)",
        labelHi: "पीला प्रीमियम (तेल > 19%)",
        labelBn: "হলুদ প্রিমিয়াম (তেল > ১৯%)",
        specs: "Moisture < 10%, Oil content ≥ 19%, Foreign matter < 1%",
        specsHi: "नमी < 10%, तेल मात्रा ≥ 19%, बाहरी तत्व < 1%",
        specsBn: "আর্দ্রতা < ১০%, তেলের পরিমাণ ≥ ১৯%, অপদ্রব্য < ১%",
      },
      "Grade B": {
        price: 4892,
        label: "Standard Yellow (FAQ)",
        labelHi: "मानक पीला (FAQ)",
        labelBn: "স্ট্যান্ডার্ড হলুদ (FAQ)",
        specs: "Moisture 10–12%, Oil content 18–19%, Foreign matter < 2%",
        specsHi: "नमी 10–12%, तेल मात्रा 18–19%, बाहरी तत्व < 2%",
        specsBn: "আর্দ্রতা ১০–১২%, তেলের পরিমাণ ১৮–১৯%, অপদ্রব্য < ২%",
      },
      "Grade C": {
        price: 4500,
        label: "Commercial Crushing",
        labelHi: "व्यावसायिक पेराई ग्रेड",
        labelBn: "বাণিজ্যিক ক্রাশিং গ্রেড",
        specs: "Moisture 12–13%, Slight greenish/shriveled grains < 5%",
        specsHi: "नमी 12–13%, हरे/सिकुड़े दाने < 5%",
        specsBn: "আর্দ্রতা ১২–১৩%, সামান্য সবুজ/কুঁচকানো দানা < ৫%",
      },
      "Grade D": {
        price: 4100,
        label: "Feed Grade",
        labelHi: "पशु आहार ग्रेड",
        labelBn: "পশুখাদ্য গ্রেড",
        specs: "Moisture 13–14%, Foreign matter > 3%, High splits",
        specsHi: "नमी 13–14%, बाहरी तत्व > 3%, अधिक टूटे दाने",
        specsBn: "আর্দ্রতা ১৩–১৪%, অপদ্রব্য > ৩%, বেশি ভাঙা দানা",
      },
    },
  },
  {
    id: "maize",
    name: "Maize",
    nameHi: "मक्का",
    nameBn: "ভুট্টা",
    category: "Cereal",
    unit: "quintal",
    standardMsp: 2225,
    grades: {
      "Grade A": {
        price: 2225,
        label: "Yellow Flint Premium",
        labelHi: "पीला फ्लिंट प्रीमियम",
        labelBn: "হলুদ ফ্লিন্ট প্রিমিয়াম",
        specs: "Moisture < 14%, Foreign matter < 1%, Aflatoxin clean",
        specsHi: "नमी < 14%, बाहरी तत्व < 1%, एफ्लाटॉक्सिन मुक्त",
        specsBn: "আর্দ্রতা < ১৪%, অপদ্রব্য < ১%, অ্যাফ্লাটক্সিন মুক্ত",
      },
      "Grade B": {
        price: 2090,
        label: "Yellow Standard (FAQ)",
        labelHi: "पीला मानक (FAQ)",
        labelBn: "হলুদ স্ট্যান্ডার্ড (FAQ)",
        specs: "Moisture 14–15%, Foreign matter < 2%, Broken < 3%",
        specsHi: "नमी 14–15%, बाहरी तत्व < 2%, टूटे दाने < 3%",
        specsBn: "আর্দ্রতা ১৪–১৫%, অপদ্রব্য < ২%, ভাঙা < ৩%",
      },
      "Grade C": {
        price: 1950,
        label: "Starch / Poultry Grade",
        labelHi: "स्टार्च / पोल्ट्री ग्रेड",
        labelBn: "স্টার্চ / পোল্ট্রি গ্রেড",
        specs: "Moisture 15–16%, Slight discolored grains < 4%",
        specsHi: "नमी 15–16%, थोड़े फीके दाने < 4%",
        specsBn: "আর্দ্রতা ১৫–১৬%, সামান্য বিবর্ণ দানা < ৪%",
      },
      "Grade D": {
        price: 1800,
        label: "Feed Mixed",
        labelHi: "मिश्रित चारा ग्रेड",
        labelBn: "মিশ্র পশুখাদ্য",
        specs: "Moisture 16–17%, High moisture/broken > 5%",
        specsHi: "नमी 16–17%, अधिक नमी/टूटे दाने > 5%",
        specsBn: "আর্দ্রতা ১৬–১৭%, বেশি আর্দ্রতা/ভাঙা > ৫%",
      },
    },
  },
  {
    id: "cotton",
    name: "Cotton",
    nameHi: "कपास",
    nameBn: "তুলা",
    category: "Commercial",
    unit: "quintal",
    standardMsp: 7521,
    grades: {
      "Grade A": {
        price: 7521,
        label: "Long Staple (29.5–30.5mm)",
        labelHi: "लंबा रेशा (29.5–30.5mm)",
        labelBn: "লম্বা আঁশ (২৯.৫–৩০.৫মিমি)",
        specs: "Moisture < 8%, Trash < 3%, High micronaire & tensile strength",
        specsHi: "नमी < 8%, कचरा < 3%, उच्च गुणवत्ता रेशा",
        specsBn: "আর্দ্রতা < ৮%, আবর্জনা < ৩%, উচ্চ প্রসার্য শক্তি",
      },
      "Grade B": {
        price: 7121,
        label: "Medium Staple (26.5–28.5mm)",
        labelHi: "मध्यम रेशा (26.5–28.5mm)",
        labelBn: "মাঝারি আঁশ (২৬.৫–২৮.৫মিমি)",
        specs: "Moisture 8–9%, Trash < 4%, Standard white fiber",
        specsHi: "नमी 8–9%, कचरा < 4%, मानक सफेद रेशा",
        specsBn: "আর্দ্রতা ৮–৯%, আবর্জনা < ৪%, সাধারণ সাদা আঁশ",
      },
      "Grade C": {
        price: 6600,
        label: "Short Staple / Tinged",
        labelHi: "छोटा रेशा / हल्का पीलापन",
        labelBn: "ছোট আঁশ / সামান্য বিবর্ণ",
        specs: "Moisture 9–10%, Trash 4–6%, Slightly yellowish tint",
        specsHi: "नमी 9–10%, कचरा 4–6%, हल्का पीला रंग",
        specsBn: "আর্দ্রতা ৯–১০%, আবর্জনা ৪–৬%, সামান্য হলদে আভা",
      },
      "Grade D": {
        price: 6100,
        label: "Coarse / Low Grade",
        labelHi: "मोटा / निम्न ग्रेड",
        labelBn: "মোটা / নিম্ন গ্রেড",
        specs: "Moisture > 10%, Trash > 6%, Stained fibers",
        specsHi: "नमी > 10%, कचरा > 6%, दागदार रेशा",
        specsBn: "আর্দ্রতা > ১০%, আবর্জনা > ৬%, দাগযুক্ত আঁশ",
      },
    },
  },
  {
    id: "barley",
    name: "Barley",
    nameHi: "जौ",
    nameBn: "যব / বার্লি",
    category: "Cereal",
    unit: "quintal",
    standardMsp: 2050,
    grades: {
      "Grade A": {
        price: 2050,
        label: "Two-Row Malting Premium",
        labelHi: "माल्टिंग प्रीमियम (दो-पंक्ति)",
        labelBn: "মাল্টিং প্রিমিয়াম (টু-রো)",
        specs: "Moisture < 12%, Plump grain > 90%, High germination",
        specsHi: "नमी < 12%, पुष्ट दाना > 90%, उच्च अंकुरण क्षमता",
        specsBn: "আর্দ্রতা < ১২%, স্বাস্থ্যকর দানা > ৯০%, উচ্চ অঙ্কুরোদগম",
      },
      "Grade B": {
        price: 1850,
        label: "Six-Row Standard (FAQ)",
        labelHi: "मानक जौ (छह-पंक्ति FAQ)",
        labelBn: "স্ট্যান্ডার্ড যব (সিক্স-রো FAQ)",
        specs: "Moisture 12–13%, Plump grain > 80%, Foreign matter < 2%",
        specsHi: "नमी 12–13%, पुष्ट दाना > 80%, बाहरी तत्व < 2%",
        specsBn: "আর্দ্রতা ১২–১৩%, স্বাস্থ্যকর দানা > ৮০%, অপদ্রব্য < ২%",
      },
      "Grade C": {
        price: 1700,
        label: "Commercial Milling",
        labelHi: "व्यावसायिक मिलिंग",
        labelBn: "বাণিজ্যিক মিলিং",
        specs: "Moisture 13–14%, Broken < 4%, Foreign matter < 3%",
        specsHi: "नमी 13–14%, टूटे < 4%, बाहरी तत्व < 3%",
        specsBn: "আর্দ্রতা ১৩–১৪%, ভাঙা < ৪%, অপদ্রব্য < ৩%",
      },
      "Grade D": {
        price: 1550,
        label: "Feed Barley",
        labelHi: "पशु आहार जौ",
        labelBn: "পশুখাদ্য বার্লি",
        specs: "Moisture 14–15%, Thin/pinched grains allowed",
        specsHi: "नमी 14–15%, पतले/सिकुड़े दाने शामिल",
        specsBn: "আর্দ্রতা ১৪–১৫%, পাতলা/চাপা দানা অনুমোদিত",
      },
    },
  },
  {
    id: "bajra",
    name: "Bajra / Pearl Millet",
    nameHi: "बाजरा",
    nameBn: "বাজরা",
    category: "Cereal",
    unit: "quintal",
    standardMsp: 2625,
    grades: {
      "Grade A": {
        price: 2625,
        label: "Bold Gray Premium",
        labelHi: "मोटा ग्रे प्रीमियम दाना",
        labelBn: "বোল্ড গ্রে প্রিমিয়াম দানা",
        specs: "Moisture < 12%, Foreign matter < 1%, Free of molds",
        specsHi: "नमी < 12%, बाहरी तत्व < 1%, फफूंद मुक्त",
        specsBn: "আর্দ্রতা < ১২%, অপদ্রব্য < ১%, ছত্রাক-মুক্ত",
      },
      "Grade B": {
        price: 2500,
        label: "Standard Grain (FAQ)",
        labelHi: "मानक दाना (FAQ)",
        labelBn: "স্ট্যান্ডার্ড দানা (FAQ)",
        specs: "Moisture 12–13%, Foreign matter < 2%, Broken < 3%",
        specsHi: "नमी 12–13%, बाहरी तत्व < 2%, टूटे दाने < 3%",
        specsBn: "আর্দ্রতা ১২–১৩%, অপদ্রব্য < ২%, ভাঙা < ৩%",
      },
      "Grade C": {
        price: 2350,
        label: "Feed / Commercial",
        labelHi: "चारा / व्यावसायिक ग्रेड",
        labelBn: "পশুখাদ্য / বাণিজ্যিক গ্রেড",
        specs: "Moisture 13–14%, Foreign matter < 3%, Slight discoloration",
        specsHi: "नमी 13–14%, बाहरी तत्व < 3%, हल्का फीका रंग",
        specsBn: "আর্দ্রতা ১৩–১৪%, অপদ্রব্য < ৩%, সামান্য বিবর্ণ",
      },
      "Grade D": {
        price: 2150,
        label: "Distillery / Low Grade",
        labelHi: "आसवन / निम्न ग्रेड",
        labelBn: "ডিস্টিলারি / নিম্ন গ্রেড",
        specs: "Moisture 14–15%, High broken/shriveled > 5%",
        specsHi: "नमी 14–15%, अधिक टूटे/सिकुड़े > 5%",
        specsBn: "আর্দ্রতা ১৪–১৫%, অতিরিক্ত ভাঙা/কুঁচকানো > ৫%",
      },
    },
  },
];

export function normalizeCropName(cropStr?: string): string {
  if (!cropStr) return "wheat";
  const clean = cropStr.toLowerCase().trim();
  if (clean.includes("wheat") || clean.includes("गेहूं") || clean.includes("গম")) return "wheat";
  if (clean.includes("paddy") || clean.includes("rice") || clean.includes("धान") || clean.includes("चावल") || clean.includes("চাল")) return "paddy";
  if (clean.includes("mustard") || clean.includes("sarson") || clean.includes("सरसों") || clean.includes("राई") || clean.includes("সরিষা")) return "mustard";
  if (clean.includes("gram") || clean.includes("chana") || clean.includes("चना") || clean.includes("ছোলা")) return "gram";
  if (clean.includes("soybean") || clean.includes("soya") || clean.includes("सोयाबीन") || clean.includes("সয়াবিন")) return "soybean";
  if (clean.includes("maize") || clean.includes("makka") || clean.includes("मक्का") || clean.includes("corn") || clean.includes("ভুট্টা")) return "maize";
  if (clean.includes("cotton") || clean.includes("kapas") || clean.includes("कपास") || clean.includes("তুলা")) return "cotton";
  if (clean.includes("barley") || clean.includes("jau") || clean.includes("जौ") || clean.includes("যব")) return "barley";
  if (clean.includes("bajra") || clean.includes("millet") || clean.includes("बाजरा")) return "bajra";
  return "wheat";
}

export function getCropMspData(cropStr?: string): CropMspRate {
  const normId = normalizeCropName(cropStr);
  return (
    CROP_MSP_RATES.find((item) => item.id === normId) || CROP_MSP_RATES[0]
  );
}

export function getCropDisplayName(crop: CropMspRate, lang: string): string {
  if (lang === "hi") return crop.nameHi || crop.name;
  if (lang === "bn") return crop.nameBn || crop.nameHi || crop.name;
  return crop.name;
}

export function getCategoryDisplayName(cat: string, lang: string): string {
  if (cat === "All") {
    if (lang === "hi") return "सभी फसलें";
    if (lang === "bn") return "সমস্ত ফসল";
    return "All Crops";
  }
  const categoryMap: Record<string, { hi: string; bn: string; en: string }> = {
    Cereal: { hi: "अनाज", bn: "দানাশস্য", en: "Cereals" },
    Pulse: { hi: "दलहन", bn: "ডালজাতীয়", en: "Pulses" },
    Oilseed: { hi: "तिलहन", bn: "তৈলবীজ", en: "Oilseeds" },
    Commercial: { hi: "व्यावसायिक", bn: "বাণিজ্যিক", en: "Commercials" },
  };
  const match = categoryMap[cat];
  if (!match) return cat;
  if (lang === "hi") return match.hi;
  if (lang === "bn") return match.bn;
  return match.en;
}

export function getGradeLabel(detail: GradeDetail, lang: string): string {
  if (lang === "hi" && detail.labelHi) return detail.labelHi;
  if (lang === "bn" && detail.labelBn) return detail.labelBn;
  return detail.label;
}

export function getGradeSpecs(detail: GradeDetail, lang: string): string {
  if (lang === "hi" && detail.specsHi) return detail.specsHi;
  if (lang === "bn" && detail.specsBn) return detail.specsBn;
  return detail.specs;
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

export function getCropPriceRange(cropStr?: string): {
  minPrice: number;
  maxPrice: number;
  formattedRange: string;
  minGrade: CropGrade;
  maxGrade: CropGrade;
} {
  const data = getCropMspData(cropStr);
  const gradesList = Object.entries(data.grades) as [CropGrade, GradeDetail][];
  let minPrice = Infinity;
  let maxPrice = -Infinity;
  let minGrade: CropGrade = "Grade D";
  let maxGrade: CropGrade = "Grade A";

  gradesList.forEach(([grade, detail]) => {
    if (detail.price < minPrice) {
      minPrice = detail.price;
      minGrade = grade;
    }
    if (detail.price > maxPrice) {
      maxPrice = detail.price;
      maxGrade = grade;
    }
  });

  if (minPrice === Infinity) {
    minPrice = data.standardMsp;
    maxPrice = data.standardMsp;
  }

  return {
    minPrice,
    maxPrice,
    formattedRange: `₹${minPrice.toLocaleString("en-IN")} – ₹${maxPrice.toLocaleString("en-IN")}`,
    minGrade,
    maxGrade,
  };
}

export function calculatePayoutRange(
  cropStr: string | undefined,
  quantityInQuintals: number = 0
): {
  minRate: number;
  maxRate: number;
  quantityQuintals: number;
  minPayout: number;
  maxPayout: number;
  formattedRateRange: string;
  formattedPayoutRange: string;
  cropName: string;
} {
  const range = getCropPriceRange(cropStr);
  const safeQty = Math.max(0, Number(quantityInQuintals) || 0);
  const minPayout = Math.round(safeQty * range.minPrice);
  const maxPayout = Math.round(safeQty * range.maxPrice);

  return {
    minRate: range.minPrice,
    maxRate: range.maxPrice,
    quantityQuintals: safeQty,
    minPayout,
    maxPayout,
    formattedRateRange: range.formattedRange,
    formattedPayoutRange: `${formatINR(minPayout)} – ${formatINR(maxPayout)}`,
    cropName: getCropMspData(cropStr).name,
  };
}

