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
  // =========================================================================
  // 1. CEREALS (7 CROPS)
  // =========================================================================
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
    id: "barley",
    name: "Barley",
    nameHi: "जौ",
    nameBn: "যব / বার্লি",
    category: "Cereal",
    unit: "quintal",
    standardMsp: 1980,
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
        price: 1980,
        label: "Six-Row Standard (FAQ)",
        labelHi: "मानक जौ (छह-पंक्ति FAQ)",
        labelBn: "স্ট্যান্ডার্ড যব (সিক্স-রো FAQ)",
        specs: "Moisture 12–13%, Plump grain > 80%, Foreign matter < 2%",
        specsHi: "नमी 12–13%, पुष्ट दाना > 80%, बाहरी तत्व < 2%",
        specsBn: "আর্দ্রতা ১২–১৩%, স্বাস্থ্যকর দানা > ৮০%, অপদ্রব্য < ২%",
      },
      "Grade C": {
        price: 1780,
        label: "Commercial Milling",
        labelHi: "व्यावसायिक मिलिंग",
        labelBn: "বাণিজ্যিক মিলিং",
        specs: "Moisture 13–14%, Broken < 4%, Foreign matter < 3%",
        specsHi: "नमी 13–14%, टूटे < 4%, बाहरी तत्व < 3%",
        specsBn: "আর্দ্রতা ১৩–১৪%, ভাঙা < ৪%, অপদ্রব্য < ৩%",
      },
      "Grade D": {
        price: 1600,
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
    id: "jowar",
    name: "Jowar / Sorghum",
    nameHi: "ज्वार",
    nameBn: "জোয়ার",
    category: "Cereal",
    unit: "quintal",
    standardMsp: 3699,
    grades: {
      "Grade A": {
        price: 3749,
        label: "Maldandi Bold White Premium",
        labelHi: "मालदंडी सफेद प्रीमियम दाना",
        labelBn: "মালদন্ডি সাদা প্রিমিয়াম দানা",
        specs: "Moisture < 12%, Foreign matter < 1%, Luster white grains",
        specsHi: "नमी < 12%, बाहरी तत्व < 1%, चमकदार सफेद दाना",
        specsBn: "আর্দ্রতা < ১২%, অপদ্রব্য < ১%, উজ্জ্বল সাদা দানা",
      },
      "Grade B": {
        price: 3699,
        label: "Hybrid Standard (FAQ)",
        labelHi: "हाइब्रिड मानक ज्वार (FAQ)",
        labelBn: "হাইব্রিড স্ট্যান্ডার্ড জোয়ার (FAQ)",
        specs: "Moisture 12–13%, Foreign matter < 2%, Broken < 3%",
        specsHi: "नमी 12–13%, बाहरी तत्व < 2%, टूटे दाने < 3%",
        specsBn: "আর্দ্রতা ১২–১৩%, অপদ্রব্য < ২%, ভাঙা < ৩%",
      },
      "Grade C": {
        price: 3350,
        label: "Commercial / Flour Grade",
        labelHi: "व्यावसायिक आटा ग्रेड",
        labelBn: "বাণিজ্যিক ময়দা গ্রেড",
        specs: "Moisture 13–14%, Slight discoloration < 4%",
        specsHi: "नमी 13–14%, हल्का फीका रंग < 4%",
        specsBn: "আর্দ্রতা ১৩–১৪%, সামান্য বিবর্ণ < ৪%",
      },
      "Grade D": {
        price: 3000,
        label: "Feed / Distillery",
        labelHi: "पशु आहार / आसवन",
        labelBn: "পশুখাদ্য / ডিস্টিলারি",
        specs: "Moisture 14–15%, Broken & damaged > 5%",
        specsHi: "नमी 14–15%, टूटे एवं क्षतिग्रस्त दाने > 5%",
        specsBn: "আর্দ্রতা ১৪–১৫%, ভাঙা ও ক্ষতিগ্রস্ত > ৫%",
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
        price: 2775,
        label: "Bold Gray Premium",
        labelHi: "मोटा ग्रे प्रीमियम दाना",
        labelBn: "বোল্ড গ্রে প্রিমিয়াম দানা",
        specs: "Moisture < 12%, Foreign matter < 1%, Free of molds",
        specsHi: "नमी < 12%, बाहरी तत्व < 1%, फफूंद मुक्त",
        specsBn: "আর্দ্রতা < ১২%, অপদ্রব্য < ১%, ছত্রাক-মুক্ত",
      },
      "Grade B": {
        price: 2625,
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
        specsBn: "আর্দ্রता ১৩–১৪%, অপদ্রব্য < ৩%, সামান্য বিবর্ণ",
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
        price: 2400,
        label: "Yellow Flint Premium",
        labelHi: "पीला फ्लिंट प्रीमियम",
        labelBn: "হলুদ ফ্লিন্ট প্রিমিয়াম",
        specs: "Moisture < 14%, Foreign matter < 1%, Aflatoxin clean",
        specsHi: "नमी < 14%, बाहरी तत्व < 1%, एफ्लाटॉक्सिन मुक्त",
        specsBn: "আর্দ্রতা < ১৪%, অপদ্রব্য < ১%, অ্যাফ্লাটক্সিন মুক্ত",
      },
      "Grade B": {
        price: 2225,
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
    id: "ragi",
    name: "Ragi / Finger Millet",
    nameHi: "रागी / मड़ुआ",
    nameBn: "রাগি / মারুয়া",
    category: "Cereal",
    unit: "quintal",
    standardMsp: 4290,
    grades: {
      "Grade A": {
        price: 4886,
        label: "Bold Reddish-Brown Premium",
        labelHi: "मोटा लाल-भूरा प्रीमियम दाना",
        labelBn: "বোল্ড লালচে-বাদামী প্রিমিয়াম",
        specs: "Moisture < 12%, Foreign matter < 0.75%, Zero stones",
        specsHi: "नमी < 12%, बाहरी तत्व < 0.75%, कंकड़ मुक्त",
        specsBn: "আর্দ্রতা < ১২%, অপদ্রব্য < ০.৭৫%, পাথর-মুক্ত",
      },
      "Grade B": {
        price: 4290,
        label: "Standard Grain (FAQ)",
        labelHi: "मानक रागी (FAQ)",
        labelBn: "স্ট্যান্ডার্ড রাগি (FAQ)",
        specs: "Moisture 12–13%, Foreign matter < 1.5%, Broken < 2%",
        specsHi: "नमी 12–13%, बाहरी तत्व < 1.5%, टूटे दाने < 2%",
        specsBn: "আর্দ্রতা ১২–১৩%, অপদ্রব্য < ১.৫%, ভাঙা < ২%",
      },
      "Grade C": {
        price: 3900,
        label: "Flour Milling Grade",
        labelHi: "आटा मिलिंग ग्रेड",
        labelBn: "ময়দা মিলিং গ্রেড",
        specs: "Moisture 13–14%, Foreign matter < 2.5%",
        specsHi: "नमी 13–14%, बाहरी तत्व < 2.5%",
        specsBn: "আর্দ্রতা ১৩–১৪%, অপদ্রব্য < ২.৫%",
      },
      "Grade D": {
        price: 3500,
        label: "Feed / Mixed Quality",
        labelHi: "चारा / मिश्रित गुणवत्ता",
        labelBn: "পশুখাদ্য / মিশ্র মান",
        specs: "Moisture 14–15%, Immature/shriveled grains > 5%",
        specsHi: "नमी 14–15%, अपरिपक्व/सिकुड़े दाने > 5%",
        specsBn: "আর্দ্রতা ১৪–১৫%, অপরিপক্ক/কুঁচকানো দানা > ৫%",
      },
    },
  },

  // =========================================================================
  // 2. PULSES (5 CROPS)
  // =========================================================================
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
    id: "arhar",
    name: "Arhar / Tur",
    nameHi: "अरहर / तुअर",
    nameBn: "অড়হর / তুর",
    category: "Pulse",
    unit: "quintal",
    standardMsp: 7550,
    grades: {
      "Grade A": {
        price: 8000,
        label: "Bold Red/White Export Grade",
        labelHi: "मोटा लाल/सफेद निर्यात ग्रेड",
        labelBn: "বোল্ড লাল/সাদা রপ্তানি গ্রেড",
        specs: "Moisture < 10%, Weeviled < 0.5%, Foreign matter < 0.5%",
        specsHi: "नमी < 10%, कीट ग्रसित < 0.5%, बाहरी तत्व < 0.5%",
        specsBn: "আর্দ্রতা < ১০%, পোকা ধরা < ০.৫%, অপদ্রব্য < ০.৫%",
      },
      "Grade B": {
        price: 7550,
        label: "Standard Red (FAQ)",
        labelHi: "मानक लाल तुअर (FAQ)",
        labelBn: "স্ট্যান্ডার্ড লাল তুর (FAQ)",
        specs: "Moisture 10–12%, Foreign matter < 1%, Broken < 2%",
        specsHi: "नमी 10–12%, बाहरी तत्व < 1%, टूटे दाने < 2%",
        specsBn: "আর্দ্রতা ১০–১২%, অপদ্রব্য < ১%, ভাঙা < ২%",
      },
      "Grade C": {
        price: 7000,
        label: "Medium Dal Processing",
        labelHi: "मध्यम दाल पेराई ग्रेड",
        labelBn: "মাঝারি ডাল প্রসেসিং গ্রেড",
        specs: "Moisture 12–13%, Broken 2–4%, Chipped < 3%",
        specsHi: "नमी 12–13%, टूटे 2–4%, कटे-फटे < 3%",
        specsBn: "আর্দ্রতা ১২–১৩%, ভাঙা ২–৪%, খণ্ডিত < ৩%",
      },
      "Grade D": {
        price: 6400,
        label: "Small / Rain-affected",
        labelHi: "छोटा दाना / बारिश से प्रभावित",
        labelBn: "ছোট দানা / বৃষ্টিতে ক্ষতিগ্রস্ত",
        specs: "Moisture > 13%, Discolored > 5%",
        specsHi: "नमी > 13%, फीका रंग > 5%",
        specsBn: "আর্দ্রতা > ১৩%, বিবর্ণ > ৫%",
      },
    },
  },
  {
    id: "moong",
    name: "Moong / Green Gram",
    nameHi: "मूंग",
    nameBn: "মুগ",
    category: "Pulse",
    unit: "quintal",
    standardMsp: 8682,
    grades: {
      "Grade A": {
        price: 8768,
        label: "Shiny Bold Green Premium",
        labelHi: "चमकदार मोटा हरा प्रीमियम",
        labelBn: "চকচকে বোল্ড সবুজ প্রিমিয়াম",
        specs: "Moisture < 10%, Foreign matter < 0.5%, Lustrous deep green",
        specsHi: "नमी < 10%, बाहरी तत्व < 0.5%, चमकदार गहरा हरा",
        specsBn: "আর্দ্রতা < ১০%, অপদ্রব্য < ০.৫%, উজ্জ্বল গাঢ় সবুজ",
      },
      "Grade B": {
        price: 8682,
        label: "Standard Whole (FAQ)",
        labelHi: "मानक साबुत मूंग (FAQ)",
        labelBn: "স্ট্যান্ডার্ড গোটা মুগ (FAQ)",
        specs: "Moisture 10–11%, Foreign matter < 1.0%, Broken < 2%",
        specsHi: "नमी 10–11%, बाहरी तत्व < 1.0%, टूटे दाने < 2%",
        specsBn: "আর্দ্রতা ১০–১১%, অপদ্রব্য < ১.০%, ভাঙা < ২%",
      },
      "Grade C": {
        price: 8100,
        label: "Commercial Milling",
        labelHi: "व्यावसायिक मिलिंग",
        labelBn: "বাণিজ্যিক মিলিং",
        specs: "Moisture 11–12%, Dull green, Broken 2–4%",
        specsHi: "नमी 11–12%, फीका हरा, टूटे 2–4%",
        specsBn: "আর্দ্রতা ১১–১২%, অনুজ্জ্বল সবুজ, ভাঙা ২–৪%",
      },
      "Grade D": {
        price: 7400,
        label: "Split / Discolored",
        labelHi: "टूटे / फीके दाने",
        labelBn: "ভাঙা / বিবর্ণ দানা",
        specs: "Moisture > 12%, Split/shriveled > 6%",
        specsHi: "नमी > 12%, कटे/सिकुड़े > 6%",
        specsBn: "আর্দ্রতা > ১২%, ভাঙা/কুঁচকানো > ৬%",
      },
    },
  },
  {
    id: "urad",
    name: "Urad / Black Gram",
    nameHi: "उड़द",
    nameBn: "কলাই / উড়দ",
    category: "Pulse",
    unit: "quintal",
    standardMsp: 7400,
    grades: {
      "Grade A": {
        price: 7800,
        label: "Polished Bold Black Premium",
        labelHi: "पॉलिश मोटा काला प्रीमियम",
        labelBn: "পালিশ করা বোল্ড কালো প্রিমিয়াম",
        specs: "Moisture < 10%, Foreign matter < 0.5%, Uniform bold seeds",
        specsHi: "नमी < 10%, बाहरी तत्व < 0.5%, एकसमान मोटा दाना",
        specsBn: "আর্দ্রতা < ১০%, অপদ্রব্য < ০.৫%, অভিন্ন মোটা দানা",
      },
      "Grade B": {
        price: 7400,
        label: "Standard Whole (FAQ)",
        labelHi: "मानक साबुत उड़द (FAQ)",
        labelBn: "স্ট্যান্ডার্ড গোটা উড়দ (FAQ)",
        specs: "Moisture 10–12%, Foreign matter < 1.0%, Broken < 2%",
        specsHi: "नमी 10–12%, बाहरी तत्व < 1.0%, टूटे दाने < 2%",
        specsBn: "আর্দ্রতা ১০–১২%, অপদ্রব্য < ১.০%, ভাঙা < ২%",
      },
      "Grade C": {
        price: 6800,
        label: "Dal Processing Grade",
        labelHi: "दाल पेराई ग्रेड",
        labelBn: "ডাল প্রসেসিং গ্রেড",
        specs: "Moisture 12–13%, Slight greenish tint, Broken 2–4%",
        specsHi: "नमी 12–13%, हल्का हरापन, टूटे 2–4%",
        specsBn: "আর্দ্রতা ১২–১৩%, সামান্য সবুজ আভা, ভাঙা ২–৪%",
      },
      "Grade D": {
        price: 6200,
        label: "Small / Off-color",
        labelHi: "छोटा दाना / फीका रंग",
        labelBn: "ছোট দানা / বিবর্ণ",
        specs: "Moisture > 13%, Damaged/immature > 6%",
        specsHi: "नमी > 13%, क्षतिग्रस्त/अपरिपक्व > 6%",
        specsBn: "আর্দ্রতা > ১৩%, ক্ষতিগ্রস্ত/অপরিপক্ক > ৬%",
      },
    },
  },
  {
    id: "lentil",
    name: "Lentil / Masur",
    nameHi: "मसूर",
    nameBn: "মসুর ডাল",
    category: "Pulse",
    unit: "quintal",
    standardMsp: 6700,
    grades: {
      "Grade A": {
        price: 6700,
        label: "Bold Crimson / Malkamashour",
        labelHi: "मोटा मलका मसूर प्रीमियम",
        labelBn: "বোল্ড মলকা মসুর প্রিমিয়াম",
        specs: "Moisture < 10%, Foreign matter < 0.75%, Deep orange-red cotyledons",
        specsHi: "नमी < 10%, बाहरी तत्व < 0.75%, गहरा नारंगी-लाल दाना",
        specsBn: "আর্দ্রতা < ১০%, অপদ্রব্য < ০.৭৫%, গাঢ় কমলা-লাল দানা",
      },
      "Grade B": {
        price: 6425,
        label: "Standard Whole Masur (FAQ)",
        labelHi: "मानक साबुत मसूर (FAQ)",
        labelBn: "স্ট্যান্ডার্ড গোটা মসুর (FAQ)",
        specs: "Moisture 10–12%, Foreign matter < 1.5%, Broken < 3%",
        specsHi: "नमी 10–12%, बाहरी तत्व < 1.5%, टूटे दाने < 3%",
        specsBn: "আর্দ্রতা ১০–১২%, অপদ্রব্য < ১.৫%, ভাঙা < ৩%",
      },
      "Grade C": {
        price: 6000,
        label: "Commercial Milling",
        labelHi: "व्यावसायिक मिलिंग",
        labelBn: "বাণিজ্যিক মিলিং",
        specs: "Moisture 12–13%, Broken 3–5%, Slightly discolored",
        specsHi: "नमी 12–13%, टूटे 3–5%, थोड़ा फीका रंग",
        specsBn: "আর্দ্রতা ১২–১৩%, ভাঙা ৩–৫%, সামান্য বিবর্ণ",
      },
      "Grade D": {
        price: 5400,
        label: "Small / Split Dal",
        labelHi: "छोटा दाना / कटी मसूर",
        labelBn: "ছোট দানা / খণ্ডিত ডাল",
        specs: "Moisture > 13%, Splits > 6%, Foreign matter > 2.5%",
        specsHi: "नमी > 13%, कटे दाने > 6%, बाहरी तत्व > 2.5%",
        specsBn: "আর্দ্রতা > ১৩%, খণ্ডিত > ৬%, অপদ্রব্য > ২.৫%",
      },
    },
  },

  // =========================================================================
  // 3. OILSEEDS (8 CROPS)
  // =========================================================================
  {
    id: "groundnut",
    name: "Groundnut / Peanut",
    nameHi: "मूंगफली",
    nameBn: "চিনেবাদাম",
    category: "Oilseed",
    unit: "quintal",
    standardMsp: 6783,
    grades: {
      "Grade A": {
        price: 7263,
        label: "Bold Pods (Oil > 48%)",
        labelHi: "मोटा दाना फली (तेल > 48%)",
        labelBn: "বোল্ড খোসাযুক্ত (তেল > ৪৮%)",
        specs: "Moisture < 8%, Shelling > 72%, Oil ≥ 48%, Aflatoxin free",
        specsHi: "नमी < 8%, दाना अनुपात > 72%, तेल ≥ 48%, एफ्लाटॉक्सिन मुक्त",
        specsBn: "আর্দ্রতা < ৮%, দানার অনুপাত > ৭২%, তেল ≥ ৪৮%, বিষাক্ততা-মুক্ত",
      },
      "Grade B": {
        price: 6783,
        label: "Standard In-Shell (FAQ)",
        labelHi: "मानक फली (FAQ)",
        labelBn: "স্ট্যান্ডার্ড খোসাযুক্ত (FAQ)",
        specs: "Moisture 8–9%, Shelling > 68%, Oil 44–47%, Impurities < 2%",
        specsHi: "नमी 8–9%, दाना अनुपात > 68%, तेल 44–47%, अशुद्धियां < 2%",
        specsBn: "আর্দ্রতা ৮–৯%, দানার অনুপাত > ৬৮%, তেল ৪৪–৪৭%, অপদ্রব্য < ২%",
      },
      "Grade C": {
        price: 6200,
        label: "Medium Kernel",
        labelHi: "मध्यम दाना पेराई ग्रेड",
        labelBn: "মাঝারি দানা ক্রাশিং গ্রেড",
        specs: "Moisture 9–10%, Shelling 64–67%, Oil 40–43%",
        specsHi: "नमी 9–10%, दाना अनुपात 64–67%, तेल 40–43%",
        specsBn: "আর্দ্রতা ৯–১০%, দানার অনুপাত ৬৪–৬৭%, তেল ৪০–৪৩%",
      },
      "Grade D": {
        price: 5600,
        label: "Small / Crushing Grade",
        labelHi: "छोटी फली / तेल पेराई",
        labelBn: "ছোট খোসা / তেল নিষ্পেষণ",
        specs: "Moisture > 10%, High pops (empty pods) > 6%",
        specsHi: "नमी > 10%, खाली फलियां > 6%",
        specsBn: "আর্দ্রতা > ১০%, ফাঁপা খোসা > ৬%",
      },
    },
  },
  {
    id: "mustard",
    name: "Mustard / Sarson",
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
    id: "toria",
    name: "Toria",
    nameHi: "तोरिया / लाही",
    nameBn: "তোরিয়া / লাহি",
    category: "Oilseed",
    unit: "quintal",
    standardMsp: 5950,
    grades: {
      "Grade A": {
        price: 5950,
        label: "High Oil Bold Seed (> 41%)",
        labelHi: "उच्च तेल मोटा दाना (> 41%)",
        labelBn: "উচ্চ তেল মোটা দানা (> ৪১%)",
        specs: "Moisture < 8%, Oil content ≥ 41%, Impurities < 1%",
        specsHi: "नमी < 8%, तेल मात्रा ≥ 41%, अशुद्धियां < 1%",
        specsBn: "আর্দ্রতা < ৮%, তেলের পরিমাণ ≥ ৪১%, অপদ্রব্য < ১%",
      },
      "Grade B": {
        price: 5600,
        label: "Standard Toria (FAQ)",
        labelHi: "मानक तोरिया (FAQ)",
        labelBn: "স্ট্যান্ডার্ড তোরিয়া (FAQ)",
        specs: "Moisture 8–9%, Oil content 38–40%, Impurities < 2%",
        specsHi: "नमी 8–9%, तेल मात्रा 38–40%, अशुद्धियां < 2%",
        specsBn: "আর্দ্রতা ৮–৯%, তেলের পরিমাণ ৩৮–৪০%, অপদ্রব্য < ২%",
      },
      "Grade C": {
        price: 5150,
        label: "Commercial Crushing",
        labelHi: "व्यावसायिक पेराई ग्रेड",
        labelBn: "বাণিজ্যিক ক্রাশিং গ্রেড",
        specs: "Moisture 9–10%, Oil content 35–37%, Impurities < 3%",
        specsHi: "नमी 9–10%, तेल मात्रा 35–37%, अशुद्धियां < 3%",
        specsBn: "আর্দ্রতা ৯–১০%, তেলের পরিমাণ ৩৫–৩৭%, অপদ্রব্য < ৩%",
      },
      "Grade D": {
        price: 4700,
        label: "Low Oil / Mixed",
        labelHi: "कम तेल / मिश्रित",
        labelBn: "কম তেল / মিশ্র",
        specs: "Moisture > 10%, Oil < 35%, High chaff",
        specsHi: "नमी > 10%, तेल < 35%, अधिक कचरा",
        specsBn: "আর্দ্রতা > ১০%, তেল < ৩৫%, অতিরিক্ত আবর্জনা",
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
    standardMsp: 4892,
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
    id: "sunflower",
    name: "Sunflower Seed",
    nameHi: "सूरजमुखी",
    nameBn: "সূর্যমুখী বীজ",
    category: "Oilseed",
    unit: "quintal",
    standardMsp: 7280,
    grades: {
      "Grade A": {
        price: 7721,
        label: "Bold Black Seed (Oil > 40%)",
        labelHi: "मोटा काला बीज (तेल > 40%)",
        labelBn: "বোল্ড কালো বীজ (তেল > ৪০%)",
        specs: "Moisture < 8%, Oil content ≥ 40%, Foreign matter < 1%",
        specsHi: "नमी < 8%, तेल मात्रा ≥ 40%, बाहरी तत्व < 1%",
        specsBn: "আর্দ্রতা < ৮%, তেলের পরিমাণ ≥ ৪০%, অপদ্রব্য < ১%",
      },
      "Grade B": {
        price: 7280,
        label: "Standard Black (FAQ)",
        labelHi: "मानक काला बीज (FAQ)",
        labelBn: "স্ট্যান্ডার্ড কালো বীজ (FAQ)",
        specs: "Moisture 8–9%, Oil content 37–39%, Foreign matter < 2%",
        specsHi: "नमी 8–9%, तेल मात्रा 37–39%, बाहरी तत्व < 2%",
        specsBn: "আর্দ্রতা ৮–৯%, তেলের পরিমাণ ৩৭–৩৯%, অপদ্রব্য < ২%",
      },
      "Grade C": {
        price: 6700,
        label: "Commercial Crushing",
        labelHi: "व्यावसायिक पेराई ग्रेड",
        labelBn: "বাণিজ্যিক ক্রাশিং গ্রেড",
        specs: "Moisture 9–10%, Oil content 34–36%, Foreign matter < 3%",
        specsHi: "नमी 9–10%, तेल मात्रा 34–36%, बाहरी तत्व < 3%",
        specsBn: "আর্দ্রতা ৯–১০%, তেলের পরিমাণ ৩৪–৩৬%, অপদ্রব্য < ৩%",
      },
      "Grade D": {
        price: 6000,
        label: "Striped / Low Oil",
        labelHi: "धारीदार / कम तेल",
        labelBn: "ডোরাকাটা / কম তেল",
        specs: "Moisture > 10%, Empty shells/chaff > 6%",
        specsHi: "नमी > 10%, खोखले बीज/भूसा > 6%",
        specsBn: "আর্দ্রতা > ১০%, ফাঁপা বীজ/তুষ > ৬%",
      },
    },
  },
  {
    id: "sesamum",
    name: "Sesamum / Til",
    nameHi: "तिल",
    nameBn: "তিল",
    category: "Oilseed",
    unit: "quintal",
    standardMsp: 9267,
    grades: {
      "Grade A": {
        price: 9846,
        label: "Natural Bold White (Export Grade)",
        labelHi: "प्राकृतिक मोटा सफेद (निर्यात ग्रेड)",
        labelBn: "প্রাকৃতিক বোল্ড সাদা (রপ্তানি গ্রেড)",
        specs: "Moisture < 6%, Purity > 99.5%, Oil ≥ 48%, Pearly white",
        specsHi: "नमी < 6%, शुद्धता > 99.5%, तेल ≥ 48%, मोती जैसा सफेद",
        specsBn: "আর্দ্রতা < ৬%, বিশুদ্ধতা > ৯৯.৫%, তেল ≥ ৪৮%, মুক্তোর মতো সাদা",
      },
      "Grade B": {
        price: 9267,
        label: "Standard White/Brown (FAQ)",
        labelHi: "मानक सफेद/भूरा तिल (FAQ)",
        labelBn: "স্ট্যান্ডার্ড সাদা/বাদামী তিল (FAQ)",
        specs: "Moisture 6–8%, Purity > 98%, Oil 44–47%",
        specsHi: "नमी 6–8%, शुद्धता > 98%, तेल 44–47%",
        specsBn: "আর্দ্রতা ৬–৮%, বিশুদ্ধতা > ৯৮%, তেল ৪৪–৪৭%",
      },
      "Grade C": {
        price: 8500,
        label: "Black / Mixed Til",
        labelHi: "काला / मिश्रित तिल",
        labelBn: "কালো / মিশ্র তিল",
        specs: "Moisture 8–9%, Mixed color, Foreign matter < 3%",
        specsHi: "नमी 8–9%, मिश्रित रंग, बाहरी तत्व < 3%",
        specsBn: "আর্দ্রতা ৮–৯%, মিশ্র রঙ, অপদ্রব্য < ৩%",
      },
      "Grade D": {
        price: 7800,
        label: "Crushing / Small Seed",
        labelHi: "तेल पेराई / छोटा दाना",
        labelBn: "তেল নিষ্পেষণ / ছোট বীজ",
        specs: "Moisture > 9%, Sand/dust > 2%, Oil < 40%",
        specsHi: "नमी > 9%, धूल/मिट्टी > 2%, तेल < 40%",
        specsBn: "আর্দ্রতা > ৯%, ধুলোবালি > ২%, তেল < ৪০%",
      },
    },
  },
  {
    id: "safflower",
    name: "Safflower Seed",
    nameHi: "कुसुम",
    nameBn: "কুসুম ফুল বীজ",
    category: "Oilseed",
    unit: "quintal",
    standardMsp: 5800,
    grades: {
      "Grade A": {
        price: 5940,
        label: "Bold Clean Seed (Oil > 32%)",
        labelHi: "मोटा साफ दाना (तेल > 32%)",
        labelBn: "বোল্ড পরিষ্কার বীজ (তেল > ৩২%)",
        specs: "Moisture < 8%, Oil content ≥ 32%, Impurities < 1%",
        specsHi: "नमी < 8%, तेल मात्रा ≥ 32%, अशुद्धियां < 1%",
        specsBn: "আর্দ্রতা < ৮%, তেলের পরিমাণ ≥ ৩২%, অপদ্রব্য < ১%",
      },
      "Grade B": {
        price: 5800,
        label: "Standard Safflower (FAQ)",
        labelHi: "मानक कुसुम (FAQ)",
        labelBn: "স্ট্যান্ডার্ড কুসুম (FAQ)",
        specs: "Moisture 8–9%, Oil content 29–31%, Impurities < 2%",
        specsHi: "नमी 8–9%, तेल मात्रा 29–31%, अशुद्धियां < 2%",
        specsBn: "আর্দ্রতা ৮–৯%, তেলের পরিমাণ ২৯–৩১%, অপদ্রব্য < ২%",
      },
      "Grade C": {
        price: 5300,
        label: "Commercial Crushing",
        labelHi: "व्यावसायिक पेराई",
        labelBn: "বাণিজ্যিক ক্রাশিং",
        specs: "Moisture 9–10%, Oil content 26–28%, Impurities < 3%",
        specsHi: "नमी 9–10%, तेल मात्रा 26–28%, अशुद्धियां < 3%",
        specsBn: "আর্দ্রতা ৯–১০%, তেলের পরিমাণ ২৬–২৮%, অপদ্রব্য < ৩%",
      },
      "Grade D": {
        price: 4800,
        label: "Low Oil / Chaff Mixed",
        labelHi: "कम तेल / भूसा मिश्रित",
        labelBn: "কম তেল / তুষ মিশ্রিত",
        specs: "Moisture > 10%, Empty hull ratio > 6%",
        specsHi: "नमी > 10%, खाली छिलका > 6%",
        specsBn: "আর্দ্রতা > ১০%, ফাঁপা খোসা > ৬%",
      },
    },
  },
  {
    id: "nigerseed",
    name: "Nigerseed / Ramtil",
    nameHi: "रामतिल",
    nameBn: "রামতিল",
    category: "Oilseed",
    unit: "quintal",
    standardMsp: 8717,
    grades: {
      "Grade A": {
        price: 9537,
        label: "Shiny Jet Black (Oil > 38%)",
        labelHi: "चमकदार गहरा काला (तेल > 38%)",
        labelBn: "চকচকে জেট ব্ল্যাক (তেল > ৩৮%)",
        specs: "Moisture < 8%, Oil content ≥ 38%, Zero sand/stones",
        specsHi: "नमी < 8%, तेल मात्रा ≥ 38%, मिट्टी-कंकड़ मुक्त",
        specsBn: "আর্দ্রতা < ৮%, তেলের পরিমাণ ≥ ৩৮%, ধুলোবালি-মুক্ত",
      },
      "Grade B": {
        price: 8717,
        label: "Standard Whole (FAQ)",
        labelHi: "मानक साबुत रामतिल (FAQ)",
        labelBn: "স্ট্যান্ডার্ড রামতিল (FAQ)",
        specs: "Moisture 8–9%, Oil content 35–37%, Impurities < 2%",
        specsHi: "नमी 8–9%, तेल मात्रा 35–37%, अशुद्धियां < 2%",
        specsBn: "আর্দ্রতা ৮–৯%, তেলের পরিমাণ ৩৫–৩৭%, অপদ্রব্য < ২%",
      },
      "Grade C": {
        price: 8000,
        label: "Commercial Crushing",
        labelHi: "व्यावसायिक पेराई ग्रेड",
        labelBn: "বাণিজ্যিক ক্রাশিং গ্রেড",
        specs: "Moisture 9–10%, Oil content 32–34%, Impurities < 3%",
        specsHi: "नमी 9–10%, तेल मात्रा 32–34%, अशुद्धियां < 3%",
        specsBn: "আর্দ্রতা ৯–১০%, তেলের পরিমাণ ৩২–৩৪%, অপদ্রব্য < ৩%",
      },
      "Grade D": {
        price: 7200,
        label: "Mixed / Low Oil",
        labelHi: "मिश्रित / कम तेल",
        labelBn: "মিশ্র / কম তেল",
        specs: "Moisture > 10%, Small/shriveled seeds, High chaff",
        specsHi: "नमी > 10%, सिकुड़े बीज, अधिक कचरा",
        specsBn: "আর্দ্রতা > ১০%, কুঁচকানো বীজ, অতিরিক্ত আবর্জনা",
      },
    },
  },

  // =========================================================================
  // 4. COMMERCIAL CROPS (3 CROPS)
  // =========================================================================
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
        specsBn: "আর্দ্রता > ১০%, আবর্জনা > ৬%, দাগযুক্ত আঁশ",
      },
    },
  },
  {
    id: "copra",
    name: "Copra / Coconut",
    nameHi: "सूखा नारियल / खोपरा",
    nameBn: "শুকনো নারকেল / কোপরা",
    category: "Commercial",
    unit: "quintal",
    standardMsp: 12027,
    grades: {
      "Grade A": {
        price: 12500,
        label: "Ball Copra (Whole Clean)",
        labelHi: "गोला खोपरा (साबुत प्रीमियम)",
        labelBn: "বল কোপরা (গোটা প্রিমিয়াম)",
        specs: "Moisture < 6%, White clean cup, Zero fungus/insects",
        specsHi: "नमी < 6%, सफेद साफ खोपरा, फफूंद/कीट मुक्त",
        specsBn: "আর্দ্রতা < ৬%, সাদা পরিষ্কার কোপরা, ছত্রাক/পোকা-মুক্ত",
      },
      "Grade B": {
        price: 12027,
        label: "Milling Copra (FAQ)",
        labelHi: "मिलिंग खोपरा (FAQ)",
        labelBn: "মিলিং কোপরা (FAQ)",
        specs: "Moisture 6–7%, Oil content ≥ 68%, Moldy cups < 2%",
        specsHi: "नमी 6–7%, तेल मात्रा ≥ 68%, फफूंद युक्त < 2%",
        specsBn: "আর্দ্রতা ৬–৭%, তেলের পরিমাণ ≥ ৬৮%, ছত্রাক ধরা < ২%",
      },
      "Grade C": {
        price: 10800,
        label: "Commercial Crushing",
        labelHi: "व्यावसायिक पेराई ग्रेड",
        labelBn: "বাণিজ্যিক ক্রাশিং গ্রেড",
        specs: "Moisture 7–8%, Oil content 64–67%, Slightly wrinkled",
        specsHi: "नमी 7–8%, तेल मात्रा 64–67%, थोड़ा सिकुड़ा हुआ",
        specsBn: "আর্দ্রতা ৭–৮%, তেলের পরিমাণ ৬৪–৬৭%, সামান্য কুঁচকানো",
      },
      "Grade D": {
        price: 9600,
        label: "Off-color / Damaged",
        labelHi: "धब्बेदार / निम्न ग्रेड",
        labelBn: "দাগযুক্ত / নিম্ন মান",
        specs: "Moisture > 8%, Discolored cups > 5%, Broken pieces",
        specsHi: "नमी > 8%, फीके टुकड़े > 5%, टूटे हुए",
        specsBn: "আর্দ্রতা > ৮%, বিবর্ণ টুকরো > ৫%, ভাঙা অংশ",
      },
    },
  },
  {
    id: "jute",
    name: "Raw Jute",
    nameHi: "कच्चा पटसन / जूट",
    nameBn: "কাঁচা পাট",
    category: "Commercial",
    unit: "quintal",
    standardMsp: 5335,
    grades: {
      "Grade A": {
        price: 5650,
        label: "TD-3 Golden Lustrous (Export)",
        labelHi: "TD-3 सुनहरा चमकदार (निर्यात ग्रेड)",
        labelBn: "TD-3 সোনালী চকচকে (রপ্তানি গ্রেড)",
        specs: "Moisture < 14%, High tensile strength, Golden color, Zero bark",
        specsHi: "नमी < 14%, उच्च मजबूती, सुनहरा रंग, छाल मुक्त",
        specsBn: "আর্দ্রতা < ১৪%, উচ্চ শক্তি, সোনালী রঙ, বাকল-মুক্ত",
      },
      "Grade B": {
        price: 5335,
        label: "TD-4 Standard (FAQ)",
        labelHi: "TD-4 मानक रेशा (FAQ)",
        labelBn: "TD-4 স্ট্যান্ডার্ড আঁশ (FAQ)",
        specs: "Moisture 14–16%, Good strength, Light brownish, Bark < 2%",
        specsHi: "नमी 14–16%, अच्छी मजबूती, हल्का भूरा, छाल < 2%",
        specsBn: "আর্দ্রতা ১৪–১৬%, ভাল শক্তি, হালকা বাদামী, বাকল < ২%",
      },
      "Grade C": {
        price: 4800,
        label: "TD-5 Commercial Mill",
        labelHi: "TD-5 मिलिंग ग्रेड",
        labelBn: "TD-5 মিলিং গ্রেড",
        specs: "Moisture 16–18%, Medium strength, Specky, Bark 2–5%",
        specsHi: "नमी 16–18%, मध्यम मजबूती, छाल 2–5%",
        specsBn: "আর্দ্রতা ১৬–১৮%, মাঝারি শক্তি, দাগযুক্ত, বাকল ২–৫%",
      },
      "Grade D": {
        price: 4200,
        label: "Coarse / Rooty",
        labelHi: "मोटा / जड़दार रेशा",
        labelBn: "মোটা / শিকড়যুক্ত আঁশ",
        specs: "Moisture > 18%, Harsh/dull fiber, High root cuttings > 8%",
        specsHi: "नमी > 18%, खुरदुरा रेशा, जड़ भाग > 8%",
        specsBn: "আর্দ্রতা > ১৮%, রুক্ষ আঁশ, অতিরিক্ত শিকড় > ৮%",
      },
    },
  },
];

export function normalizeCropName(cropStr?: string): string {
  if (!cropStr) return "wheat";
  const clean = cropStr.toLowerCase().trim();

  // Cereals
  if (clean.includes("wheat") || clean.includes("गेहूं") || clean.includes("গম")) return "wheat";
  if (clean.includes("paddy") || clean.includes("rice") || clean.includes("धान") || clean.includes("चावल") || clean.includes("চাল")) return "paddy";
  if (clean.includes("barley") || clean.includes("jau") || clean.includes("जौ") || clean.includes("যব") || clean.includes("বার্লি")) return "barley";
  if (clean.includes("jowar") || clean.includes("sorghum") || clean.includes("ज्वार") || clean.includes("জোয়ার")) return "jowar";
  if (clean.includes("bajra") || clean.includes("millet") || clean.includes("बाजरा")) return "bajra";
  if (clean.includes("maize") || clean.includes("makka") || clean.includes("मक्का") || clean.includes("corn") || clean.includes("ভুট্টা")) return "maize";
  if (clean.includes("ragi") || clean.includes("finger millet") || clean.includes("mandua") || clean.includes("रागी") || clean.includes("मड़ुआ") || clean.includes("রাগি")) return "ragi";

  // Pulses
  if (clean.includes("gram") || clean.includes("chana") || clean.includes("चना") || clean.includes("ছোলা")) return "gram";
  if (clean.includes("arhar") || clean.includes("tur") || clean.includes("toor") || clean.includes("pigeon pea") || clean.includes("अरहर") || clean.includes("तुअर") || clean.includes("অড়হর")) return "arhar";
  if (clean.includes("moong") || clean.includes("mung") || clean.includes("green gram") || clean.includes("मूंग") || clean.includes("মুগ")) return "moong";
  if (clean.includes("urad") || clean.includes("black gram") || clean.includes("उड़द") || clean.includes("কলাই") || clean.includes("উড়দ")) return "urad";
  if (clean.includes("lentil") || clean.includes("masur") || clean.includes("masoor") || clean.includes("मसूर") || clean.includes("মসুর")) return "lentil";

  // Oilseeds
  if (clean.includes("groundnut") || clean.includes("peanut") || clean.includes("moongfali") || clean.includes("मूंगफली") || clean.includes("चिनेবাদাম")) return "groundnut";
  if (clean.includes("mustard") || clean.includes("sarson") || clean.includes("rai") || clean.includes("rapeseed") || clean.includes("सरसों") || clean.includes("राई") || clean.includes("সরিষা")) return "mustard";
  if (clean.includes("toria") || clean.includes("lahi") || clean.includes("तोरिया") || clean.includes("लाही") || clean.includes("তোরিয়া")) return "toria";
  if (clean.includes("soybean") || clean.includes("soya") || clean.includes("सोयाबीन") || clean.includes("সয়াবিন")) return "soybean";
  if (clean.includes("sunflower") || clean.includes("surajmukhi") || clean.includes("सूरजमुखी") || clean.includes("সূর্যমুখী")) return "sunflower";
  if (clean.includes("sesamum") || clean.includes("sesame") || clean.includes("til") || clean.includes("तिल") || clean.includes("তিল")) return "sesamum";
  if (clean.includes("safflower") || clean.includes("kusum") || clean.includes("kardi") || clean.includes("कुसुम") || clean.includes("কুসুম")) return "safflower";
  if (clean.includes("nigerseed") || clean.includes("niger") || clean.includes("ramtil") || clean.includes("रामतिल") || clean.includes("রামতিল")) return "nigerseed";

  // Commercials
  if (clean.includes("cotton") || clean.includes("kapas") || clean.includes("कपास") || clean.includes("তুলা")) return "cotton";
  if (clean.includes("copra") || clean.includes("coconut") || clean.includes("nariyal") || clean.includes("खोपरा") || clean.includes("सूखा नारियल") || clean.includes("নারকেল") || clean.includes("কোপরা")) return "copra";
  if (clean.includes("jute") || clean.includes("patson") || clean.includes("पटसन") || clean.includes("जूट") || clean.includes("পাট")) return "jute";

  return "wheat";
}

export function getCropMspData(cropStr?: string): CropMspRate {
  if (!cropStr) return CROP_MSP_RATES[0];
  const directMatch = CROP_MSP_RATES.find(
    (c) =>
      c.id.toLowerCase() === cropStr.toLowerCase() ||
      c.name.toLowerCase() === cropStr.toLowerCase() ||
      c.nameHi.toLowerCase() === cropStr.toLowerCase() ||
      c.nameBn.toLowerCase() === cropStr.toLowerCase()
  );
  if (directMatch) return directMatch;
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
    Cereal: { hi: "अनाज (Cereals)", bn: "দানাশস্য", en: "Cereals (7)" },
    Pulse: { hi: "दलहन (Pulses)", bn: "ডালজাতীয়", en: "Pulses (5)" },
    Oilseed: { hi: "तिलहन (Oilseeds)", bn: "তৈলবীজ", en: "Oilseeds (8)" },
    Commercial: { hi: "व्यावसायिक (Commercial)", bn: "বাণিজ্যিক", en: "Commercial (3)" },
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
