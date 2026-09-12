import { PROCUREMENT_CENTRES } from "./locations-centres";
import { CROP_MSP_RATES, getCropMspData, formatINR } from "./msp-rates";
import { Booking } from "./types";

export type SupportedLanguageCode = "hi" | "en" | "bn" | "pa" | "mr" | "gu" | "te" | "ta";

export interface SupportedLanguageInfo {
  code: SupportedLanguageCode;
  nativeName: string;
  englishName: string;
  flag: string;
  greeting: string;
  badge: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguageInfo[] = [
  { code: "hi", nativeName: "हिन्दी", englishName: "Hindi", flag: "🌾", greeting: "नमस्ते किसान भाई!", badge: "HI" },
  { code: "pa", nativeName: "ਪੰਜਾਬੀ", englishName: "Punjabi", flag: "🌾", greeting: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਕਿਸਾਨ ਵੀਰੋ!", badge: "PA" },
  { code: "mr", nativeName: "मराठी", englishName: "Marathi", flag: "🌾", greeting: "नमस्कार शेतकरी बंधूंनो!", badge: "MR" },
  { code: "gu", nativeName: "ગુજરાતી", englishName: "Gujarati", flag: "🌾", greeting: "નમસ્તે ખેડૂત મિત્ર!", badge: "GU" },
  { code: "bn", nativeName: "বাংলা", englishName: "Bengali", flag: "🌾", greeting: "নমস্কার কৃষক ভাই!", badge: "BN" },
  { code: "te", nativeName: "తెలుగు", englishName: "Telugu", flag: "🌾", greeting: "నమస్కారం రైతు సోదరులారా!", badge: "TE" },
  { code: "ta", nativeName: "தமிழ்", englishName: "Tamil", flag: "🌾", greeting: "வணக்கம் விவசாய தோழரே!", badge: "TA" },
  { code: "en", nativeName: "English", englishName: "English", flag: "🌐", greeting: "Welcome Farmer Friend!", badge: "EN" },
];

export interface FarmerChatContext {
  farmerId?: string;
  farmerName?: string;
  farmerMobile?: string;
  activeBooking?: Partial<Booking> | null;
  language?: string;
}

export const AI_TOOL_DECLARATIONS = [
  {
    name: "get_token_status",
    description: "Get the farmer's current smart procurement token number, state, date, and assigned centre.",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_queue_status",
    description: "Get the farmer's live queue rank, number of farmers ahead, and estimated wait time in minutes.",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_centre_status",
    description: "Get the live operational status, queue length, and congestion levels of all Mandi procurement centres.",
    parameters: {
      type: "object",
      properties: {
        location: { type: "string", description: "Optional location/district name like Bhopal, Sehore, Indore" },
      },
    },
  },
  {
    name: "recommend_centre",
    description: "Recommend the best procurement centre with the lowest wait time and easiest bay clearance.",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_best_time_to_visit",
    description: "Get recommended arrival time window with the lowest expected congestion for unloading produce.",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_procurement_status",
    description: "Get quality grading, weighbridge net weight, moisture deduction, and official clearance status of produce.",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_payment_status",
    description: "Get live MSP payment calculation, DBT disbursement status, and J-Form payment receipt reference.",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_farmer_profile",
    description: "Get verified farmer registration profile, mobile number, landholding, and registered crops.",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "register_complaint",
    description: "Register an official farmer grievance or operational complaint regarding delays, grading, or gate entry.",
    parameters: {
      type: "object",
      properties: {
        message: { type: "string", description: "Detailed complaint description or grievance from farmer" },
      },
      required: ["message"],
    },
  },
];

// In-memory complaints store
const complaintsDb: Array<{ id: string; farmerMobile: string; message: string; timestamp: string; status: string }> = [];

export function executeTool(name: string, args: Record<string, any>, context: FarmerChatContext): any {
  const booking = context.activeBooking;
  const farmerName = context.farmerName || booking?.farmerName || "Farmer";
  const farmerMobile = context.farmerMobile || booking?.farmerMobile || "9876543210";

  switch (name) {
    case "get_token_status": {
      if (!booking || !booking.token) {
        return {
          hasActiveToken: false,
          message: "No active procurement booking found. Farmer needs to book a slot first.",
        };
      }
      return {
        hasActiveToken: true,
        token: booking.token || (booking.tokenNumber ? `#${booking.tokenNumber}` : "BHO-113"),
        status: booking.status || booking.queueStatus || "WAITING",
        centre: booking.centre || "Lakshmipur Procurement Centre",
        date: booking.date || "2026-09-13",
        arrivalTime: booking.arrivalTime || booking.time || "10:30 AM",
        fullTimeSlot: booking.fullTime || "10:30 AM – 11:00 AM",
        crop: booking.crop || "Wheat",
        quantityQuintals: booking.actualQuantity ?? booking.quantity ?? 40,
        crops: booking.crops || undefined,
        cancellationReason: booking.cancellationReason || undefined,
      };
    }

    case "get_queue_status": {
      if (!booking || !booking.token) {
        return {
          inQueue: false,
          message: "No active queue position. You can book a new token anytime.",
        };
      }
      const position = booking.queuePosition ?? 2;
      const farmersAhead = Math.max(0, position - 1);
      const waitTime = booking.status === "WAITING" ? booking.waitTime ?? farmersAhead * 6 : 0;
      return {
        inQueue: true,
        token: booking.token,
        queuePosition: position,
        farmersAhead,
        estimatedWaitMinutes: waitTime,
        status: booking.status || "WAITING",
        activeBays: 4,
        centre: booking.centre || "Lakshmipur Procurement Centre",
      };
    }

    case "get_centre_status": {
      const loc = (args.location || "bhopal").toLowerCase();
      const centres = PROCUREMENT_CENTRES.filter(
        (c) => c.location.toLowerCase().includes(loc) || c.state.toLowerCase().includes(loc)
      ).slice(0, 4);

      const resultCentres = (centres.length > 0 ? centres : PROCUREMENT_CENTRES.slice(0, 4)).map((c, i) => {
        const queueLength = [4, 8, 14, 22][i % 4];
        const congestion = queueLength <= 6 ? "LOW" : queueLength <= 15 ? "MEDIUM" : "HIGH";
        return {
          id: c.id,
          name: c.name,
          location: c.location,
          distance: c.distance,
          bays: c.bays,
          activeQueue: queueLength,
          estimatedWaitMinutes: c.baseWaitMinutes + queueLength * 4,
          congestion,
          status: "OPEN",
        };
      });
      return { centres: resultCentres };
    }

    case "recommend_centre": {
      const best = PROCUREMENT_CENTRES[0];
      return {
        recommendedCentre: {
          id: best.id,
          name: best.name,
          location: best.location,
          distance: best.distance,
          estimatedWaitMinutes: 15,
          congestion: "LOW",
          activeBays: best.bays,
          reason: "Lowest wait time and fastest bay clearance right now.",
        },
        alternatives: PROCUREMENT_CENTRES.slice(1, 3).map((c) => ({
          name: c.name,
          distance: c.distance,
          estimatedWaitMinutes: c.baseWaitMinutes + 12,
        })),
      };
    }

    case "get_best_time_to_visit": {
      return {
        recommendedSlot: "10:30 AM – 11:30 AM",
        reason: "Morning gate rush settles after 10:00 AM, providing the shortest unload wait time (~15 mins).",
        todayCongestionTrend: [
          { time: "09:00 AM – 10:00 AM", congestion: "HIGH", avgWait: "35 mins" },
          { time: "10:30 AM – 11:30 AM", congestion: "LOW", avgWait: "15 mins" },
          { time: "12:00 PM – 01:30 PM", congestion: "MEDIUM", avgWait: "22 mins" },
          { time: "02:30 PM – 04:00 PM", congestion: "LOW", avgWait: "12 mins" },
        ],
      };
    }

    case "get_procurement_status": {
      if (!booking || !booking.token) {
        return { status: "NO_RECORD", message: "No active procurement found." };
      }
      const crop = booking.crop || "Wheat";
      const cropMsp = getCropMspData(crop);
      const isGraded = Boolean(booking.cropGrade || booking.status === "PROCESSING" || booking.status === "COMPLETED");
      return {
        token: booking.token,
        crop,
        grade: booking.cropGrade || (isGraded ? "Grade A" : "Pending Inspection"),
        bookedQuantity: booking.quantity || 40,
        actualWeighedQuantity: booking.actualQuantity ?? (isGraded ? booking.quantity ?? 40 : "Pending Weighment"),
        status: booking.status || "WAITING",
        verification: booking.verifiedBy ? "APPROVED" : "PENDING",
        verifiedBy: booking.verifiedBy || "Pending officer verification",
        appliedMspRate: booking.mspRate || cropMsp.standardMsp,
        moistureDeduction: "0% (Within FAQ standard < 12%)",
      };
    }

    case "get_payment_status": {
      if (!booking || !booking.token) {
        return { status: "NO_PAYMENT", message: "No procurement payout record found." };
      }
      const crop = booking.crop || "Wheat";
      const cropMsp = getCropMspData(crop);
      const rate = booking.mspRate || cropMsp.standardMsp;
      const qty = booking.actualQuantity ?? booking.quantity ?? 40;
      const totalAmount = booking.totalPayout || rate * qty;
      const isCompleted = booking.status === "COMPLETED";

      return {
        token: booking.token,
        totalPayout: totalAmount,
        formattedPayout: formatINR(totalAmount),
        ratePerQuintal: rate,
        weighedQuintals: qty,
        paymentStatus: isCompleted ? "AUTHORIZED_FOR_DBT" : "CALCULATED_PENDING_FINALIZATION",
        disbursementChannel: "Direct Bank Transfer (DBT) to Aadhaar-Linked Bank Account",
        receiptRef: `MandiMitra-REC-${String(booking.token || "101").replace(/^#/, "")}-2026`,
        estimatedCredit: isCompleted ? "Within 24-48 business hours directly into your bank account" : "Will initiate immediately after official procurement completion",
      };
    }

    case "get_farmer_profile": {
      return {
        farmerName,
        farmerMobile,
        farmerId: context.farmerId || (booking?.farmerId ? booking.farmerId : "FMR-4245"),
        district: "Bhopal",
        state: "Madhya Pradesh",
        registeredCrops: ["Wheat (गेहूं)", "Soybean (सोयाबीन)", "Mustard (सरसों)"],
        activeBookingsCount: booking?.token ? 1 : 0,
        activeToken: booking?.token || "None",
      };
    }

    case "contact_centre": {
      const centreName = booking?.centre || "Lakshmipur Procurement Centre";
      const matched =
        PROCUREMENT_CENTRES.find(
          (c) =>
            c.name.toLowerCase() === centreName.toLowerCase() ||
            c.name.toLowerCase().includes(centreName.toLowerCase()) ||
            centreName.toLowerCase().includes(c.name.toLowerCase())
        ) || PROCUREMENT_CENTRES[0];

      return {
        centreName: matched.name,
        location: `${matched.location}, ${matched.state}`,
        distance: matched.distance,
        bays: matched.bays,
        inChargeName: "श्री राजेश शर्मा (केंद्र प्रभारी / Mandi In-Charge)",
        phone: matched.contactNumber || "0755-2741021",
        mobileHotline: "+91 98260 12345",
        tollFreeHelpdesk: "1800-180-1551",
        operatingHours: "सुबह 08:00 AM से शाम 06:00 PM (सोमवार - शनिवार)",
        address: `${matched.name}, मुख्य मंडी प्रांगण, ${matched.location}`,
        facilities: [
          "इलेक्ट्रॉनिक धर्मकांटा (Electronic Weighbridge)",
          "डिजिटल नमी मापक यंत्र (Moisture Meter)",
          "किसान विश्राम गृह एवं शुद्ध पेयजल (Rest House)",
        ],
        nearbyCentres: PROCUREMENT_CENTRES.filter((c) => c.id !== matched.id).slice(0, 2).map((c) => ({
          name: c.name,
          phone: c.contactNumber,
          distance: c.distance,
        })),
      };
    }

    case "get_msp_rate_card": {
      return {
        season: "रबी एवं खरीफ विपणन सत्र 2026-27",
        rates: CROP_MSP_RATES,
      };
    }

    case "get_helpline_info": {
      return {
        kisanCallCentre: "1800-180-1551",
        stateControlRoom: "0755-2551234",
        centreHelpline: "0755-2741021",
        whatsappSupport: "+91 98260 12345",
        email: "support@mandimitra.gov.in",
        operatingHours: "24x7 (टोल-फ्री किसान कॉल सेंटर)",
      };
    }

    case "register_complaint": {
      const complaintId = `GRV-${Date.now().toString().slice(-6)}`;
      const complaintMsg = String(args.message || "General operational issue reported by farmer.");
      complaintsDb.push({
        id: complaintId,
        farmerMobile,
        message: complaintMsg,
        timestamp: new Date().toISOString(),
        status: "OPEN",
      });
      return {
        success: true,
        complaintId,
        status: "REGISTERED",
        message: `Your grievance has been officially registered with ID #${complaintId}. The Mandi supervisor has been notified.`,
      };
    }

    default:
      return { error: `Tool ${name} not found.` };
  }
}

export interface MenuItemOption {
  label: string;
  action: string;
  icon?: string;
  phone?: string;
  link?: string;
  description?: string;
  variant?: "primary" | "secondary" | "danger" | "call";
}

export interface SmartEngineResult {
  text: string;
  toolUsed: string;
  toolResult: any;
  menuOptions: MenuItemOption[];
}
export function detectLanguageFromText(text: string): SupportedLanguageCode | null {
  if (!text) return null;
  if (/[\u0A00-\u0A7F]/.test(text)) return "pa"; // Gurmukhi (Punjabi)
  if (/[\u0A80-\u0AFF]/.test(text)) return "gu"; // Gujarati
  if (/[\u0980-\u09FF]/.test(text)) return "bn"; // Bengali
  if (/[\u0C00-\u0C7F]/.test(text)) return "te"; // Telugu
  if (/[\u0B80-\u0BFF]/.test(text)) return "ta"; // Tamil
  if (/[\u0900-\u097F]/.test(text)) {
    if (/(माझे|आहे|कधी|रांग|पैसे|शेतकरी|तपासा|सांगा|काटा|हमीभाव)/i.test(text)) return "mr";
    return "hi";
  }
  return null;
}

export function getMainMenuOptions(language: string = "hi"): MenuItemOption[] {
  const lang = (language || "hi").toLowerCase();

  if (lang === "pa") {
    return [
      {
        label: "ਟੋਕਨ ਤੇ ਕਤਾਰ ਸਥਿਤੀ",
        description: "ਸਰਗਰਮ ਟੋਕਨ ਨੰਬਰ ਅਤੇ ਲਾਈਵ ਉਡੀਕ ਸਮਾਂ",
        action: "ਟੋਕਨ ਸਥਿਤੀ",
        icon: "🎫",
      },
      {
        label: "ਖਰੀਦ ਕੇਂਦਰ ਨਾਲ ਸੰਪਰਕ",
        description: "ਕੇਂਦਰ ਇੰਚਾਰਜ ਫ਼ੋਨ ਨੰਬਰ ਤੇ ਸਿੱਧਾ ਕਾਲ",
        action: "ਕੇਂਦਰ ਸੰਪਰਕ",
        icon: "📞",
        phone: "0755-2741021",
        variant: "call",
      },
      {
        label: "ਤੁਲਾਈ ਤੇ ਗੁਣਵੱਤਾ ਜਾਂਚ",
        description: "ਧਰਮਕੰਡੇ 'ਤੇ ਵਜ਼ਨ, ਨਮੀ ਤੇ ਗ੍ਰੇਡ ਰਿਪੋਰਟ",
        action: "ਤੁਲਾਈ ਤੇ ਵਜ਼ਨ",
        icon: "⚖️",
      },
      {
        label: "ਐੱਮ.ਐੱਸ.ਪੀ. ਭਾਅ ਤੇ ਭੁਗਤਾਨ",
        description: "2026-27 ਸਰਕਾਰੀ ਰੇਟ ਤੇ ਡੀਬੀਟੀ ਭੁਗਤਾਨ",
        action: "ਐੱਮਐੱਸਪੀ ਭੁਗਤਾਨ",
        icon: "💰",
      },
      {
        label: "ਆਉਣ ਦਾ ਸਹੀ ਸਮਾਂ",
        description: "ਅੱਜ ਦੀ ਭੀੜ ਸਾਰਣੀ ਤੇ ਘੱਟੋ-ਘੱਟ ਉਡੀਕ ਸਮਾਂ",
        action: "ਆਉਣ ਦਾ ਸਹੀ ਸਮਾਂ",
        icon: "🕒",
      },
      {
        label: "ਕਿਸਾਨ ਹੈਲਪਲਾਈਨ ਤੇ ਸਹਾਇਤਾ",
        description: "ਟੋਲ-ਫ਼੍ਰੀ 1800-180-1551 ਤੇ ਸ਼ਿਕਾਇਤ ਦਰਜ",
        action: "ਕਿਸਾਨ ਹੈਲਪਲਾਈਨ",
        icon: "🚨",
      },
    ];
  }

  if (lang === "mr") {
    return [
      {
        label: "टोकन व रांगेची स्थिती",
        description: "सक्रिय टोकन क्रमांक व रांगेतील वेळ",
        action: "टोकन स्थिती",
        icon: "🎫",
      },
      {
        label: "खरेदी केंद्राशी संपर्क",
        description: "केंद्र प्रमुख अधिकाऱ्यांचा फोन व थेट कॉल",
        action: "केंद्र संपर्क",
        icon: "📞",
        phone: "0755-2741021",
        variant: "call",
      },
      {
        label: "वजन व गुणवत्ता तपासणी",
        description: "काटा वजन, ओलावा व प्रतवारी अहवाल",
        action: "वजन तपासणी",
        icon: "⚖️",
      },
      {
        label: "हमीभाव दर व पेमेंट",
        description: "२०२६-२७ हमीभाव व थेट बँक खात्यात पैसे",
        action: "हमीभाव पेमेंट",
        icon: "💰",
      },
      {
        label: "येण्याची योग्य वेळ",
        description: "आजची गर्दी सारणी व जलद धान्य अनलोड",
        action: "येण्याची वेळ",
        icon: "🕒",
      },
      {
        label: "शेतकरी हेल्पलाइन व मदत",
        description: "टोल-फ्री १८००-१८०-१५५१ व तक्रार निवारण",
        action: "शेतकरी हेल्पलाइन",
        icon: "🚨",
      },
    ];
  }

  if (lang === "gu") {
    return [
      {
        label: "ટોકન અને કતાર સ્થિતિ",
        description: "સક્રિય સ્માર્ટ ટોકન અને પ્રતીક્ષા સમય",
        action: "ટોકન સ્થિતિ",
        icon: "🎫",
      },
      {
        label: "ખરીદ કેન્દ્રનો સંપર્ક",
        description: "અધિકારીનો ફોન નંબર અને સીધો કૉલ",
        action: "કેન્દ્ર સંપર્ક",
        icon: "📞",
        phone: "0755-2741021",
        variant: "call",
      },
      {
        label: "તોલ અને ગુણવત્તા તપાસ",
        description: "કાંટા પર વજન, ભેજ અને ગ્રેડ રિપોર્ટ",
        action: "તોલ વજન",
        icon: "⚖️",
      },
      {
        label: "ટેકાના ભાવ અને ચૂકવણી",
        description: "૨૦૨૬-૨૭ MSP ભાવ અને બેંક ખાતામાં DBT",
        action: "ટેકાના ભાવ ચૂકવણી",
        icon: "💰",
      },
      {
        label: "આવવાનો યોગ્ય સમય",
        description: "આજની ભીડ અને સૌથી ઓછો સમય",
        action: "આવવાનો સમય",
        icon: "🕒",
      },
      {
        label: "ખેડૂત હેલ્પલાઇન અને સહાય",
        description: "ટોલ-ફ્રી ૧૮૦૦-૧૮૦-૧૫૫૧ અને ફરિયાદ",
        action: "ખેડૂત હેલ્પલાઇન",
        icon: "🚨",
      },
    ];
  }

  if (lang === "te") {
    return [
      {
        label: "టోకెన్ & క్యూ స్థితి",
        description: "యాక్టివ్ టోకెన్ మరియు క్యూ నిరీక్షణ సమయం",
        action: "టోకెన్ స్థితి",
        icon: "🎫",
      },
      {
        label: "కేంద్రాన్ని సంప్రదించండి",
        description: "ఇన్‌చార్జ్ అధికారి ఫోన్ & డైరెక్ట్ కాల్",
        action: "కేంద్రం సంప్రదించండి",
        icon: "📞",
        phone: "0755-2741021",
        variant: "call",
      },
      {
        label: "తూకం & నాణ్యత తనిఖీ",
        description: "వేబ్రిడ్జ్ బరువు, తేమ & గ్రేడ్ నివేదిక",
        action: "తూకం తనిఖీ",
        icon: "⚖️",
      },
      {
        label: "ఎంఎస్‌పి ధరలు & చెల్లింపు",
        description: "మద్దతు ధర & బ్యాంక్ ఖాతాలో డీబీటీ",
        action: "ఎంఎస్‌పి చెల్లింపు",
        icon: "💰",
      },
      {
        label: "రాకకు ఉత్తమ సమయం",
        description: "రద్దీ వివరాలు & త్వరిత అన్‌లోడింగ్",
        action: "రాక సమయం",
        icon: "🕒",
      },
      {
        label: "రైతు హెల్ప్‌లైన్ & సహాయం",
        description: "టోల్-ఫ్రీ 1800-180-1551 & ఫిర్యాదులు",
        action: "రైతు హెల్ప్‌లైన్",
        icon: "🚨",
      },
    ];
  }

  if (lang === "ta") {
    return [
      {
        label: "டோக்கன் & வரிசை நிலை",
        description: "செயலில் உள்ள டோக்கன் மற்றும் காத்திருப்பு நேரம்",
        action: "டோக்கன் நிலை",
        icon: "🎫",
      },
      {
        label: "கொள்முதல் மைய தொடர்பு",
        description: "அதிகாரி எண் மற்றும் நேரடி அழைப்பு",
        action: "மைய தொடர்பு",
        icon: "📞",
        phone: "0755-2741021",
        variant: "call",
      },
      {
        label: "எடை & தர பரிசோதனை",
        description: "எடை அளவு, ஈரப்பதம் & தர அறிக்கை",
        action: "எடை பரிசோதனை",
        icon: "⚖️",
      },
      {
        label: "எம்எஸ்பி விலை & பணம்",
        description: "அரசு கொள்முதல் விலை & நேரடி வங்கி வரவு",
        action: "எம்எஸ்பி பணம்",
        icon: "💰",
      },
      {
        label: "வர வேண்டிய சிறந்த நேரம்",
        description: "நெரிசல் இல்லாத நேரம் & வேகமான இறக்குதல்",
        action: "வருகை நேரம்",
        icon: "🕒",
      },
      {
        label: "விவசாயி உதவி எண் & புகார்",
        description: "கட்டணமில்லா 1800-180-1551 & உதவி மையம்",
        action: "விவசாயி உதவி",
        icon: "🚨",
      },
    ];
  }

  if (lang === "bn") {
    return [
      {
        label: "টোকেন ও লাইভ সারি",
        description: "সক্রিয় টোকেন নম্বর ও সারির অপেক্ষার সময়",
        action: "টোকেন অবস্থা",
        icon: "🎫",
      },
      {
        label: "কেন্দ্রে যোগাযোগ করুন",
        description: "কর্মকর্তার ফোন নম্বর, সময়সূচী ও সরাসরি কল",
        action: "কেন্দ্রে যোগাযোগ",
        icon: "📞",
        phone: "0755-2741021",
        variant: "call",
      },
      {
        label: "ফসলের ওজন ও মান",
        description: "ধর্মকাঁটার ওজন, আর্দ্রতা ও গ্রেডিং রিপোর্ট",
        action: "ফসলের ওজন",
        icon: "⚖️",
      },
      {
        label: "এমএসপি ও পেমেন্ট",
        description: "২০২৬-২৭ সরকারি দর ও ডিবিটি ব্যাংক পেমেন্ট",
        action: "এমএসপি ও পেমেন্ট",
        icon: "💰",
      },
      {
        label: "আসার সেরা সময়",
        description: "কম ভিড়ের সময়সূচী ও দ্রুত খালাস ব্যবস্থা",
        action: "আসার সেরা সময়",
        icon: "🕒",
      },
      {
        label: "কৃষক হেল্পলাইন ও সাহায্য",
        description: "টোল-ফ্রি ১৮০০-১৮০-১৫৫১ ও অভিযোগ নিবন্ধন",
        action: "কৃষক হেল্পলাইন",
        icon: "🚨",
      },
    ];
  }

  if (lang === "en") {
    return [
      {
        label: "Token & Queue Status",
        description: "Active smart token & real-time wait minutes",
        action: "Token status",
        icon: "🎫",
      },
      {
        label: "Contact Centre",
        description: "Officer phone, operating hours & direct call",
        action: "Contact centre",
        icon: "📞",
        phone: "0755-2741021",
        variant: "call",
      },
      {
        label: "Weighbridge & Quality",
        description: "Net weighment, moisture & FAQ grade",
        action: "Weighbridge quality",
        icon: "⚖️",
      },
      {
        label: "MSP Rates & Payment",
        description: "2026-27 MSP rates & DBT bank account transfer",
        action: "MSP payment",
        icon: "💰",
      },
      {
        label: "Best Arrival Time",
        description: "Hourly rush chart & recommended unloading window",
        action: "Best arrival time",
        icon: "🕒",
      },
      {
        label: "Helpline & Grievance",
        description: "Toll-Free 1800-180-1551 & supervisor support",
        action: "Kisan helpline",
        icon: "🚨",
      },
    ];
  }

  // Default Hindi
  return [
    {
      label: "टोकन व कतार स्थिति",
      description: "सक्रिय टोकन, नंबर और कतार में प्रतीक्षा समय",
      action: "टोकन स्थिति",
      icon: "🎫",
    },
    {
      label: "केंद्र से संपर्क करें",
      description: "प्रभारी अधिकारी का नंबर, समय व सीधा कॉल",
      action: "केंद्र संपर्क",
      icon: "📞",
      phone: "0755-2741021",
      variant: "call",
    },
    {
      label: "तुलाई व गुणवत्ता जांच",
      description: "धर्मकांटा वजन, नमी और ग्रेडिंग रिपोर्ट",
      action: "तुलाई और वजन",
      icon: "⚖️",
    },
    {
      label: "एमएसपी दरें व भुगतान",
      description: "2026-27 सरकारी भाव और DBT बैंक अंतरण",
      action: "एमएसपी और भुगतान",
      icon: "💰",
    },
    {
      label: "आने का सही समय",
      description: "आज की भीड़ सारणी व न्यूनतम प्रतीक्षा समय",
      action: "आने का सही समय",
      icon: "🕒",
    },
    {
      label: "किसान हेल्पलाइन व सहायता",
      description: "टोल-फ्री 1800-180-1551 व शिकायत दर्ज करें",
      action: "किसान हेल्पलाइन",
      icon: "🚨",
    },
  ];
}

export function getBackOption(language: string = "hi"): MenuItemOption {
  const lang = (language || "hi").toLowerCase();
  if (lang === "pa") return { label: "🔙 ਮੁੱਖ ਮੈਨੂ", action: "ਮੈਨੂ", icon: "🔙" };
  if (lang === "mr") return { label: "🔙 मुख्य मेनू", action: "मेनू", icon: "🔙" };
  if (lang === "gu") return { label: "🔙 મુખ્ય મેનુ", action: "મેનુ", icon: "🔙" };
  if (lang === "bn") return { label: "🔙 প্রধান মেনু", action: "মেনু", icon: "🔙" };
  if (lang === "te") return { label: "🔙 ప్రధాన మెనూ", action: "మెనూ", icon: "🔙" };
  if (lang === "ta") return { label: "🔙 முதன்மை பட்டியல்", action: "பட்டியல்", icon: "🔙" };
  if (lang === "en") return { label: "🔙 Main Menu", action: "menu", icon: "🔙" };
  return { label: "🔙 मुख्य मेनू", action: "मेनू", icon: "🔙" };
}

/**
 * Smart deterministic multilingual menu-driven rule engine for offline / zero-API-key operation.
 * Accurately serves Indian farmers in 8 languages (Hindi, Punjabi, Marathi, Gujarati, Bengali, Telugu, Tamil, English).
 */
export function smartRuleEngine(
  query: string,
  context: FarmerChatContext,
  language: string = "hi"
): SmartEngineResult {
  const detected = detectLanguageFromText(query);
  const l = (detected || language || "hi").toLowerCase() as SupportedLanguageCode;
  const q = query.toLowerCase().trim();

  // LANGUAGE SELECTION REQUEST
  if (
    q === "language" ||
    q === "भाषा" ||
    q.includes("language") ||
    q.includes("भाषा बदलो") ||
    q.includes("ਬੋਲੀ") ||
    q.includes("ભાષા") ||
    q.includes("భాష") ||
    q.includes("மொழி")
  ) {
    const langOptions: MenuItemOption[] = SUPPORTED_LANGUAGES.map((item) => ({
      label: `${item.flag} ${item.nativeName} (${item.englishName})`,
      description: item.greeting,
      action: `भाषा ${item.code}`,
      icon: item.flag,
    }));

    return {
      text:
        l === "pa"
          ? "🌐 **ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ (Select Language):**\nਹੇਠਾਂ ਦਿੱਤੀ ਕਿਸੇ ਵੀ ਭਾਸ਼ਾ 'ਤੇ ਟੈਪ ਕਰੋ:"
          : l === "mr"
          ? "🌐 **आपली भाषा निवडा (Select Language):**\nखालीलपैकी कोणत्याही भाषेवर टॅप करा:"
          : l === "gu"
          ? "🌐 **તમારી ભાષા પસંદ કરો (Select Language):**\nનીચે આપેલ કોઈપણ ભાષા પર ક્લિક કરો:"
          : l === "bn"
          ? "🌐 **আপনার ভাষা নির্বাচন করুন (Select Language):**\nনিচের যে কোনো ভাষায় ট্যাপ করুন:"
          : l === "te"
          ? "🌐 **మీ భాషను ఎంచుకోండి (Select Language):**\nక్రింది భాషలలో ఒకదానిని ఎంచుకోండి:"
          : l === "ta"
          ? "🌐 **உங்கள் மொழியைத் தேர்ந்தெடுக்கவும் (Select Language):**\nகீழே உள்ள மொழிகளில் ஒன்றைத் தட்டவும்:"
          : l === "en"
          ? "🌐 **Select Your Language:**\nPlease choose your regional language below:"
          : "🌐 **अपनी भाषा चुनें (Select Your Language):**\nसहायता के लिए नीचे दी गई किसी भी भारतीय भाषा पर टैप करें:",
      toolUsed: "language_selector",
      toolResult: null,
      menuOptions: langOptions,
    };
  }

  // 1. CONTACT PROCUREMENT CENTRE (Option 2 / phone / call / संपर्क / नंबर / अधिकारी / ਸੰਪਰਕ / સંપર્ક / సంప్రదించండి / தொடர்பு)
  if (
    q === "2" ||
    q.includes("contact") ||
    q.includes("call") ||
    q.includes("phone") ||
    q.includes("संपर्क") ||
    q.includes("फोन") ||
    q.includes("नंबर") ||
    q.includes("प्रभारी") ||
    q.includes("अधिकारी") ||
    q.includes("ਸੰਪਰਕ") ||
    q.includes("ਫ਼ੋਨ") ||
    q.includes("સંપર્ક") ||
    q.includes("ફોન") ||
    q.includes("যোগাযোগ") ||
    q.includes("సంప్రదించండి") ||
    q.includes("ఫోన్") ||
    q.includes("தொடர்பு")
  ) {
    const data = executeTool("contact_centre", {}, context);
    const nearby = (data.nearbyCentres || []).map((c: any) => `• ${c.name}: 📞 ${c.phone} (${c.distance})`).join("\n");
    const facs = (data.facilities || []).join(", ");

    let text = "";
    if (l === "pa") {
      text = `🏢 **ਖਰੀਦ ਕੇਂਦਰ ਸੰਪਰਕ ਅਤੇ ਸਹਾਇਤਾ:**\n• **ਕੇਂਦਰ:** ${data.centreName}\n• **ਸਥਾਨ:** ${data.location} (${data.distance})\n• **ਕੇਂਦਰ ਇੰਚਾਰਜ:** ${data.inChargeName}\n• **ਫ਼ੋਨ:** 📞 ${data.phone}\n• **ਮੋਬਾਈਲ ਹੈਲਪਲਾਈਨ:** 📱 ${data.mobileHotline}\n• **ਕੰਮ ਦਾ ਸਮਾਂ:** ${data.operatingHours}\n• **ਪਤਾ:** ${data.address}\n\n📍 **ਹੋਰ ਨੇੜਲੇ ਕੇਂਦਰ:**\n${nearby}`;
    } else if (l === "mr") {
      text = `🏢 **खरेदी केंद्र संपर्क व सहाय्यता:**\n• **केंद्राचे नाव:** ${data.centreName}\n• **स्थान:** ${data.location} (${data.distance})\n• **केंद्र प्रमुख:** ${data.inChargeName}\n• **फोन:** 📞 ${data.phone}\n• **मोबाईल:** 📱 ${data.mobileHotline}\n• **कामकाजाची वेळ:** ${data.operatingHours}\n• **पत्ता:** ${data.address}\n\n📍 **इतर जवळचे केंद्र:**\n${nearby}`;
    } else if (l === "gu") {
      text = `🏢 **ખરીદ કેન્દ્ર સંપર્ક અને સહાયતા:**\n• **કેન્દ્રનું નામ:** ${data.centreName}\n• **સ્થળ:** ${data.location} (${data.distance})\n• **પ્રભારી:** ${data.inChargeName}\n• **ફોન નંબર:** 📞 ${data.phone}\n• **મોબાઇલ હેલ્પલાઇન:** 📱 ${data.mobileHotline}\n• **સમય:** ${data.operatingHours}\n• **સરનામું:** ${data.address}`;
    } else if (l === "bn") {
      text = `🏢 **সংগ্রহ কেন্দ্র যোগাযোগ ও সহায়তা:**\n• **কেন্দ্রের নাম:** ${data.centreName}\n• **স্থান:** ${data.location} (${data.distance})\n• **ভারপ্রাপ্ত কর্মকর্তা:** ${data.inChargeName}\n• **ফোন নম্বর:** 📞 ${data.phone}\n• **মোবাইল:** 📱 ${data.mobileHotline}\n• **সময়সূচী:** ${data.operatingHours}\n• **ঠিকানা:** ${data.address}`;
    } else if (l === "te") {
      text = `🏢 **కొనుగోలు కేంద్రం సంప్రదింపు వివరాలు:**\n• **కేంద్రం:** ${data.centreName}\n• **ప్రాంతం:** ${data.location} (${data.distance})\n• **అధికారి:** ${data.inChargeName}\n• **ఫోన్:** 📞 ${data.phone}\n• **మొబైల్:** 📱 ${data.mobileHotline}\n• **పనివేళలు:** ${data.operatingHours}\n• **చిరునామా:** ${data.address}`;
    } else if (l === "ta") {
      text = `🏢 **கொள்முதல் மைய தொடர்பு மற்றும் உதவி:**\n• **மையம்:** ${data.centreName}\n• **இடம்:** ${data.location} (${data.distance})\n• **அதிகாரி:** ${data.inChargeName}\n• **தொலைபேசி:** 📞 ${data.phone}\n• **கைபேசி:** 📱 ${data.mobileHotline}\n• **வேலை நேரம்:** ${data.operatingHours}\n• **முகவரி:** ${data.address}`;
    } else if (l === "en") {
      text = `🏢 **Procurement Centre Contact Details:**\n• **Centre Name:** ${data.centreName}\n• **Location:** ${data.location} (${data.distance})\n• **In-Charge Officer:** ${data.inChargeName}\n• **Landline:** 📞 ${data.phone}\n• **Mobile Hotline:** 📱 ${data.mobileHotline}\n• **Operating Hours:** ${data.operatingHours}\n• **Address:** ${data.address}\n• **Facilities:** ${facs}\n\n📍 **Nearby Alternative Centres:**\n${nearby}`;
    } else {
      text = `🏢 **खरीद केंद्र संपर्क एवं सहायता विवरण:**\n• **केंद्र का नाम:** ${data.centreName}\n• **जिला/स्थान:** ${data.location} (${data.distance})\n• **केंद्र प्रभारी:** ${data.inChargeName}\n• **सीधा फोन:** 📞 ${data.phone}\n• **मोबाइल हेल्पलाइन:** 📱 ${data.mobileHotline}\n• **कार्य समय:** ${data.operatingHours}\n• **पता:** ${data.address}\n• **उपलब्ध सुविधाएं:** ${facs}\n\n📍 **अन्य नजदीकी केंद्र:**\n${nearby}`;
    }

    return {
      text,
      toolUsed: "contact_centre",
      toolResult: data,
      menuOptions: [
        { label: `📞 ${data.phone}`, action: "call", phone: data.phone, variant: "call" },
        getBackOption(l),
      ],
    };
  }

  // 2. TOKEN & QUEUE STATUS (Option 1 / token / कतार / queue / बारी / slot / ਟੋਕਨ / રાંગ / ટોકન / టోకెన్ / டோக்கன்)
  if (
    q === "1" ||
    q.includes("token") ||
    q.includes("ਟੋਕਨ") ||
    q.includes("टोकन") ||
    q.includes("ટોકન") ||
    q.includes("টোকেন") ||
    q.includes("టోకెన్") ||
    q.includes("டோக்கன்") ||
    q.includes("slot") ||
    q.includes("queue") ||
    q.includes("wait") ||
    q.includes("कतार") ||
    q.includes("बारी") ||
    q.includes("ਕਤਾਰ") ||
    q.includes("રાંગ") ||
    q.includes("કતાર") ||
    q.includes("সারি") ||
    q.includes("క్యూ") ||
    q.includes("வரிசை")
  ) {
    const tokenData = executeTool("get_token_status", {}, context);
    const queueData = executeTool("get_queue_status", {}, context);

    if (!tokenData.hasActiveToken) {
      const text =
        l === "pa"
          ? "ਇਸ ਸਮੇਂ ਤੁਹਾਡਾ ਕੋਈ ਸਰਗਰਮ ਖਰੀਦ ਟੋਕਨ ਨਹੀਂ ਹੈ। ਨਵਾਂ ਟੋਕਨ ਲੈਣ ਲਈ 'ਸਲਾਟ ਬੁੱਕ ਕਰੋ' 'ਤੇ ਜਾਓ।"
          : l === "mr"
          ? "सध्या तुमचे कोणतेही सक्रिय खरेदी टोकन नाही. नवीन टोकन मिळवण्यासाठी 'स्लॉट बुक करा' वर जा."
          : l === "gu"
          ? "હાલમાં તમારી પાસે કોઈ સક્રિય ટોકન નથી. નવું ટોકન મેળવવા 'સ્લોટ બુક કરો' પર જાઓ."
          : l === "bn"
          ? "বর্তমানে আপনার কোনো সক্রিয় সংগ্রহের টোকেন নেই। স্লট বুকিং পেজে নতুন টোকেন পাবেন।"
          : l === "te"
          ? "ప్రస్తుతం మీకు యాక్టివ్ కొనుగోలు టోకెన్ లేదు. కొత్త టੋకెన్ కోసం 'స్లాట్ బుక్ చేసుకోండి'."
          : l === "ta"
          ? "தற்போது செயலில் உள்ள கொள்முதல் டோக்கன் எதுவும் இல்லை. புதிய டோக்கனுக்கு முன்பதிவு செய்யவும்."
          : l === "en"
          ? "You do not have an active procurement token right now. Please book a slot to receive your smart token."
          : "वर्तमान में आपका कोई सक्रिय खरीद टोकन नहीं है। नया टोकन लेने के लिए 'खरीद स्लॉट बुक करें' पर जाएं।";

      return {
        text,
        toolUsed: "get_token_status",
        toolResult: tokenData,
        menuOptions: [
          { label: "📞 केंद्र से संपर्क करें", action: "केंद्र संपर्क", icon: "📞", variant: "call" },
          getBackOption(l),
        ],
      };
    }

    let text = "";
    if (l === "pa") {
      text = `🌾 **ਸਰਗਰਮ ਟੋਕਨ ਅਤੇ ਕਤਾਰ ਵੇਰਵਾ:**\n• **ਟੋਕਨ ਨੰਬਰ:** #${tokenData.token}\n• **ਸਥਿਤੀ:** ${tokenData.status}\n• **ਕਤਾਰ ਵਿੱਚ ਨੰਬਰ:** #${queueData.queuePosition || 2} (ਅੱਗੇ ${queueData.farmersAhead || 1} ਕਿਸਾਨ)\n• **ਉਡੀਕ ਸਮਾਂ:** ~${queueData.estimatedWaitMinutes || 12} ਮਿੰਟ\n• **ਖਰੀਦ ਕੇਂਦਰ:** ${tokenData.centre}\n• **ਸਮਾਂ:** ${tokenData.arrivalTime} (${tokenData.fullTimeSlot})\n• **ਫਸਲ:** ${tokenData.crop} (${tokenData.quantityQuintals} ਕੁਇੰਟਲ)`;
    } else if (l === "mr") {
      text = `🌾 **सक्रिय टोकन व रांग तपशील:**\n• **टोकन क्रमांक:** #${tokenData.token}\n• **स्थिती:** ${tokenData.status}\n• **रांगेतील क्रमांक:** #${queueData.queuePosition || 2} (पुढे ${queueData.farmersAhead || 1} शेतकरी)\n• **अंदाजे वेळ:** ~${queueData.estimatedWaitMinutes || 12} मिनिटे\n• **केंद्र:** ${tokenData.centre}\n• **वेळ:** ${tokenData.arrivalTime}\n• **पीक:** ${tokenData.crop} (${tokenData.quantityQuintals} क्विंटल)`;
    } else if (l === "gu") {
      text = `🌾 **સક્રિય ટોકન અને કતાર વિગત:**\n• **ટોકન નંબર:** #${tokenData.token}\n• **સ્થિતિ:** ${tokenData.status}\n• **કતારમાં સ્થાન:** #${queueData.queuePosition || 2} (આગળ ${queueData.farmersAhead || 1} ખેડૂત)\n• **અંદાજિત સમય:** ~${queueData.estimatedWaitMinutes || 12} મિનિટ\n• **કેન્દ્ર:** ${tokenData.centre}\n• **પાક:** ${tokenData.crop} (${tokenData.quantityQuintals} ક્વિન્ટલ)`;
    } else if (l === "bn") {
      text = `🌾 **টোকেন ও সারির বিবরণ:**\n• **টোকেন নম্বর:** #${tokenData.token}\n• **অবস্থা:** ${tokenData.status}\n• **সারিতে স্থান:** #${queueData.queuePosition || 2} (সামনে ${queueData.farmersAhead || 1} জন)\n• **অপেক্ষার সময়:** ~${queueData.estimatedWaitMinutes || 12} মিনিট\n• **কেন্দ্র:** ${tokenData.centre}\n• **ফসল:** ${tokenData.crop} (${tokenData.quantityQuintals} কুইন্টাল)`;
    } else if (l === "te") {
      text = `🌾 **యాక్టివ్ టోకెన్ & క్యూ వివరాలు:**\n• **టోకెన్ నంబర్:** #${tokenData.token}\n• **స్థితి:** ${tokenData.status}\n• **క్యూలో స్థానం:** #${queueData.queuePosition || 2} (ముందు ${queueData.farmersAhead || 1} రైతులు)\n• **నిరీక్షణ సమయం:** ~${queueData.estimatedWaitMinutes || 12} నిమిషాలు\n• **కేంద్రం:** ${tokenData.centre}\n• **పంట:** ${tokenData.crop} (${tokenData.quantityQuintals} క్వింటాళ్లు)`;
    } else if (l === "ta") {
      text = `🌾 **செயலில் உள்ள டோக்கன் & வரிசை:**\n• **டோக்கன் எண்:** #${tokenData.token}\n• **நிலை:** ${tokenData.status}\n• **வரிசை எண்:** #${queueData.queuePosition || 2} (முன்னால் ${queueData.farmersAhead || 1} விவசாயிகள்)\n• **காத்திருப்பு நேரம்:** ~${queueData.estimatedWaitMinutes || 12} நிமிடங்கள்\n• **மையம்:** ${tokenData.centre}\n• **பயிர்:** ${tokenData.crop} (${tokenData.quantityQuintals} குவிண்டால்)`;
    } else if (l === "en") {
      text = `🌾 **Smart Token & Live Queue Details:**\n• **Token ID:** #${tokenData.token}\n• **Current Status:** ${tokenData.status}\n• **Queue Rank:** #${queueData.queuePosition || 2} (${queueData.farmersAhead || 1} farmers ahead)\n• **Estimated Wait:** ~${queueData.estimatedWaitMinutes || 12} minutes\n• **Procurement Centre:** ${tokenData.centre}\n• **Arrival Slot:** ${tokenData.arrivalTime} (${tokenData.fullTimeSlot})\n• **Produce:** ${tokenData.crop} (${tokenData.quantityQuintals} Quintals)`;
    } else {
      text = `🌾 **सक्रिय टोकन एवं कतार विवरण:**\n• **टोकन नंबर:** #${tokenData.token}\n• **वर्तमान स्थिति:** ${tokenData.status}\n• **कतार में स्थान:** #${queueData.queuePosition || 2} (आगे ${queueData.farmersAhead || 1} किसान)\n• **अनुमानित प्रतीक्षा:** ~${queueData.estimatedWaitMinutes || 12} मिनट\n• **खरीद केंद्र:** ${tokenData.centre}\n• **समय खिड़की:** ${tokenData.arrivalTime} (${tokenData.fullTimeSlot})\n• **फसल एवं मात्रा:** ${tokenData.crop} (${tokenData.quantityQuintals} क्विंटल)`;
    }

    return {
      text,
      toolUsed: "get_token_status",
      toolResult: { tokenData, queueData },
      menuOptions: [
        { label: "📞 केंद्र से संपर्क करें", action: "केंद्र संपर्क", icon: "📞", variant: "call" },
        { label: "⚖️ तुलाई व गुणवत्ता जांच", action: "तुलाई और वजन", icon: "⚖️" },
        getBackOption(l),
      ],
    };
  }

  // 3. WEIGHBRIDGE & QUALITY (Option 3 / weigh / तुलाई / वजन / धर्मकांटा / quality / grade / moisture / नमी / ਤੁਲਾਈ / તોલ / తూకం / எடை)
  if (
    q === "3" ||
    q.includes("weigh") ||
    q.includes("तुलाई") ||
    q.includes("वजन") ||
    q.includes("धर्मकांटा") ||
    q.includes("तੁਲਾਈ") ||
    q.includes("ਵਜ਼ਨ") ||
    q.includes("काटा") ||
    q.includes("તોલ") ||
    q.includes("తూకం") ||
    q.includes("బరువు") ||
    q.includes("எடை") ||
    q.includes("ওজন") ||
    q.includes("grade") ||
    q.includes("गुणवत्ता")
  ) {
    const data = executeTool("get_procurement_status", {}, context);

    let text = "";
    if (l === "pa") {
      text = `⚖️ **ਧਰਮਕੰਡਾ ਤੁਲਾਈ ਅਤੇ ਗੁਣਵੱਤਾ ਰਿਪੋਰਟ:**\n• **ਫਸਲ:** ${data.crop}\n• **ਸ਼ੁੱਧ ਵਜ਼ਨ:** ${data.actualWeighedQuantity} ਕੁਇੰਟਲ (ਬੁੱਕ ਕੀਤਾ: ${data.bookedQuantity} ਕੁਇੰਟਲ)\n• **ਗ੍ਰੇਡ:** ${data.grade}\n• **ਨਮੀ ਜਾਂਚ:** ${data.moistureDeduction}\n• **ਐੱਮ.ਐੱਸ.ਪੀ. ਰੇਟ:** ₹${data.appliedMspRate} / ਕੁਇੰਟਲ\n• **ਖਰੀਦ ਸਥਿਤੀ:** ${data.status}`;
    } else if (l === "mr") {
      text = `⚖️ **काटा वजन व गुणवत्ता अहवाल:**\n• **पीक:** ${data.crop}\n• **निव्वळ वजन:** ${data.actualWeighedQuantity} क्विंटल (नोंदणी: ${data.bookedQuantity} क्विंटल)\n• **प्रतवारी:** ${data.grade}\n• **ओलावा:** ${data.moistureDeduction}\n• **हमीभाव:** ₹${data.appliedMspRate} / क्विंटल\n• **स्थिती:** ${data.status}`;
    } else if (l === "gu") {
      text = `⚖️ **તોલ અને ગુણવત્તા રિપોર્ટ:**\n• **પાક:** ${data.crop}\n• **વજન:** ${data.actualWeighedQuantity} ક્વિન્ટલ (બુક કરેલ: ${data.bookedQuantity} ક્વિન્ટલ)\n• **ગુણવત્તા ગ્રેડ:** ${data.grade}\n• **ભેજ:** ${data.moistureDeduction}\n• **MSP દર:** ₹${data.appliedMspRate} / ક્વિન્ટલ\n• **સ્થિતિ:** ${data.status}`;
    } else if (l === "bn") {
      text = `⚖️ **ফসলের ওজন ও গুণমান রিপোর্ট:**\n• **ফসল:** ${data.crop}\n• **পরিমাপকৃত ওজন:** ${data.actualWeighedQuantity} কুইন্টাল\n• **মান গ্রেড:** ${data.grade}\n• **আর্দ্রতা:** ${data.moistureDeduction}\n• **এমএসপি দর:** ₹${data.appliedMspRate} / কুইন্টাল`;
    } else if (l === "te") {
      text = `⚖️ **వేబ్రిడ్జ్ తూకం & నాణ్యత నివేదిక:**\n• **పంట:** ${data.crop}\n• **తూకం వేసిన బరువు:** ${data.actualWeighedQuantity} క్వింటాళ్లు\n• **గ్రేడ్:** ${data.grade}\n• **తేమ శాతం:** ${data.moistureDeduction}\n• **మద్దతు ధర:** ₹${data.appliedMspRate} / క్వింటాల్`;
    } else if (l === "ta") {
      text = `⚖️ **எடை & தர அறிக்கை:**\n• **பயிர்:** ${data.crop}\n• **நிகர எடை:** ${data.actualWeighedQuantity} குவிண்டால்\n• **தரக் குறியீடு:** ${data.grade}\n• **ஈரப்பதம்:** ${data.moistureDeduction}\n• **அரசு கொள்முதல் விலை:** ₹${data.appliedMspRate} / குவிண்டால்`;
    } else if (l === "en") {
      text = `⚖️ **Weighbridge & Crop Quality Report:**\n• **Crop:** ${data.crop}\n• **Net Weighed Quantity:** ${data.actualWeighedQuantity} Quintals (Booked: ${data.bookedQuantity} Qtl)\n• **FAQ Quality Grade:** ${data.grade}\n• **Moisture Inspection:** ${data.moistureDeduction}\n• **Verification:** ${data.verification}\n• **Applied MSP Rate:** ₹${data.appliedMspRate} / quintal\n• **Status:** ${data.status}`;
    } else {
      text = `⚖️ **धर्मकांटा तुलाई एवं गुणवत्ता रिपोर्ट:**\n• **फसल:** ${data.crop}\n• **तौला गया शुद्ध वजन:** ${data.actualWeighedQuantity} क्विंटल (बुक किया गया: ${data.bookedQuantity} क्विंटल)\n• **गुणवत्ता ग्रेड:** ${data.grade}\n• **नमी जांच:** ${data.moistureDeduction}\n• **दस्तावेज़ सत्यापन:** ${data.verification}\n• **लागू एमएसपी दर:** ₹${data.appliedMspRate} / क्विंटल\n• **अंतिम खरीद स्थिति:** ${data.status}`;
    }

    return {
      text,
      toolUsed: "get_procurement_status",
      toolResult: data,
      menuOptions: [
        { label: "💰 मेरा एमएसपी भुगतान देखें", action: "एमएसपी और भुगतान", icon: "💰" },
        { label: "📞 केंद्र से संपर्क करें", action: "केंद्र संपर्क", icon: "📞", variant: "call" },
        getBackOption(l),
      ],
    };
  }

  // 4. MSP RATES & DBT PAYMENT (Option 4 / msp / भाव / दर / payment / dbt / भुगतान / पैसा / ਭੁਗਤਾਨ / ਪੈਸੇ / ہمੀਭਾਵ / ચૂકવણી / చెల్లింపు / பணம்)
  if (
    q === "4" ||
    q.includes("msp") ||
    q.includes("एमएसपी") ||
    q.includes("ਭਾਅ") ||
    q.includes("ਰੇਟ") ||
    q.includes("हमीभाव") ||
    q.includes("ટેકાના ભાવ") ||
    q.includes("మద్దతు ధర") ||
    q.includes("payment") ||
    q.includes("dbt") ||
    q.includes("भुगतान") ||
    q.includes("पैसा") ||
    q.includes("ਰੁਪਏ") ||
    q.includes("చెల్లింపు") ||
    q.includes("பணம்") ||
    q.includes("পেমেন্ট")
  ) {
    const payData = executeTool("get_payment_status", {}, context);
    const rateData = executeTool("get_msp_rate_card", {}, context);

    let text = "";
    if (l === "pa") {
      text = `💰 **ਐੱਮ.ਐੱਸ.ਪੀ. ਭਾਅ ਅਤੇ ਡੀ.ਬੀ.ਟੀ. ਭੁਗਤਾਨ (2026-27):**\n• ਕਣਕ (Wheat): ₹2,425 / ਕੁਇੰਟਲ\n• ਝੋਨਾ (Paddy): ₹2,320 / ਕੁਇੰਟਲ\n• ਸਰ੍ਹੋਂ (Mustard): ₹5,950 / ਕੁਇੰਟਲ\n• ਛੋਲੇ (Gram): ₹5,440 / ਕੁਇੰਟਲ\n\n💳 **ਤੁਹਾਡਾ ਕੁਲ ਭੁਗਤਾਨ:** **${payData.formattedPayout || "₹97,000"}**\n• ਮਾਧਿਅਮ: ਆਧਾਰ ਲਿੰਕ ਬੈਂਕ ਖਾਤੇ ਵਿੱਚ ਡੀ.ਬੀ.ਟੀ.`;
    } else if (l === "mr") {
      text = `💰 **हमीभाव दर व थेट बँक पेमेंट (2026-27):**\n• गहू (Wheat): ₹2,425 / क्विंटल\n• धान/भात (Paddy): ₹2,320 / क्विंटल\n• मोहरी (Mustard): ₹5,950 / क्विंटल\n• हरभरा (Gram): ₹5,440 / क्विंटल\n\n💳 **एकूण रक्कम:** **${payData.formattedPayout || "₹97,000"}**\n• आधार संलग्न बँक खात्यात थेट DBT जमा`;
    } else if (l === "gu") {
      text = `💰 **ટેકાના ભાવ અને DBT ચૂકવણી (2026-27):**\n• ઘઉં: ₹2,425 / ક્વિન્ટલ\n• ડાંગર: ₹2,320 / ક્વિન્ટલ\n• રાયડો: ₹5,950 / ક્વિન્ટલ\n• ચણા: ₹5,440 / ક્વિન્ટલ\n\n💳 **કુલ ચૂકવણી રકમ:** **${payData.formattedPayout || "₹97,000"}**`;
    } else if (l === "bn") {
      text = `💰 **এমএসপি হার ও ডিবিটি পেমেন্ট (2026-27):**\n• গম: ₹২,৪২৫ / কুইন্টাল\n• ধান: ₹২,৩২০ / কুইন্টাল\n• সরিষা: ₹৫,৯৫০ / কুইন্টাল\n• ছোলা: ₹৫,৪৪০ / কুইন্টাল\n\n💳 **আপনার মোট পেমেন্ট:** **${payData.formattedPayout || "₹97,000"}**`;
    } else if (l === "te") {
      text = `💰 **మద్దతు ధర & డీబీటీ చెల్లింపు (2026-27):**\n• గోధుమలు: ₹2,425 / క్వింటాల్\n• వరి: ₹2,320 / క్వింటాల్\n• ఆవాలు: ₹5,950 / క్వింటాల్\n• శనగలు: ₹5,440 / క్వింటాల్\n\n💳 **మొత్తం చెల్లింపు:** **${payData.formattedPayout || "₹97,000"}**`;
    } else if (l === "ta") {
      text = `💰 **எம்எஸ்பி விலை & வங்கி வரவு (2026-27):**\n• கோதுமை: ₹2,425 / குவிண்டால்\n• நெல்: ₹2,320 / குவிண்டால்\n• கடுகு: ₹5,950 / குவிண்டால்\n• கொண்டைக்கடலை: ₹5,440 / குவிண்டால்\n\n💳 **மொத்த தொகை:** **${payData.formattedPayout || "₹97,000"}**`;
    } else if (l === "en") {
      text = `💰 **Official MSP Rates & DBT Payment:**\n\n📊 **Government MSP Rates (2026-27):**\n• Wheat: ₹2,425 / quintal\n• Paddy: ₹2,320 / quintal\n• Mustard: ₹5,950 / quintal\n• Gram: ₹5,440 / quintal\n• Maize: ₹2,090 / quintal\n\n💳 **Your Payout Calculation:**\n• Total Amount: **${payData.formattedPayout || "₹97,000"}**\n• Mode: Direct Bank Transfer (DBT) to Aadhaar-Linked Account\n• Status: ${payData.paymentStatus}\n• Receipt: ${payData.receiptRef || "MandiMitra-REC-113"}`;
    } else {
      text = `💰 **एमएसपी दरें एवं आपका डीबीटी भुगतान:**\n\n📊 **सरकारी न्यूनतम समर्थन मूल्य (MSP 2026-27):**\n• गेहूं (Wheat): ₹2,425 / क्विंटल\n• धान (Paddy Common): ₹2,320 / क्विंटल\n• सरसों (Mustard): ₹5,950 / क्विंटल\n• चना (Gram): ₹5,440 / क्विंटल\n• मक्का (Maize): ₹2,090 / क्विंटल\n• मूंग (Moong): ₹8,682 / क्विंटल\n\n💳 **आपके टोकन का भुगतान विवरण:**\n• कुल देय राशि: **${payData.formattedPayout || "₹97,000"}** (${payData.weighedQuintals || 40} क्विंटल @ ₹${payData.ratePerQuintal || 2425})\n• भुगतान माध्यम: प्रत्यक्ष लाभ अंतरण (DBT) आधार लिंक बैंक खाते में\n• स्थिति: ${payData.paymentStatus === "AUTHORIZED_FOR_DBT" ? "✅ बैंक अंतरण अधिकृत (AUTHORIZED)" : "⏳ तुलाई पूर्ण, सत्यापन उपरांत 24-48 घंटों में अंतरण"}\n• भुगतान रसीद: ${payData.receiptRef || "MandiMitra-REC-113"}`;
    }

    return {
      text,
      toolUsed: "get_payment_status",
      toolResult: { payData, rateData },
      menuOptions: [
        { label: "⚖️ तुलाई व गुणवत्ता जांच", action: "तुलाई और वजन", icon: "⚖️" },
        getBackOption(l),
      ],
    };
  }

  // 5. BEST TIME TO VISIT (Option 5 / time / समय / भीड़ / rush / ਸਮਾਂ / ભીડ / రద్దీ / நெரிசல் / ভিড়)
  if (
    q === "5" ||
    q.includes("best time") ||
    q.includes("time") ||
    q.includes("समय") ||
    q.includes("भीड़") ||
    q.includes("ਸਮਾਂ") ||
    q.includes("ਭੀੜ") ||
    q.includes("गर्दी") ||
    q.includes("ભીડ") ||
    q.includes("రద్దీ") ||
    q.includes("நெரிசல்") ||
    q.includes("ভিড়")
  ) {
    const data = executeTool("get_best_time_to_visit", {}, context);

    let text = "";
    if (l === "pa") {
      text = `🕒 **ਮੰਡੀ ਪਹੁੰਚਣ ਦਾ ਸਭ ਤੋਂ ਵਧੀਆ ਸਮਾਂ:**\n• **ਸਿਫਾਰਸ਼ੀ ਸਮਾਂ:** **${data.recommendedSlot}**\n• **ਸਲਾਹ:** ${data.reason}\n\n📊 10:30 AM – 11:30 AM ਦੌਰਾਨ ਸਭ ਤੋਂ ਘੱਟ ਭੀੜ ਰਹਿੰਦੀ ਹੈ।`;
    } else if (l === "mr") {
      text = `🕒 **मंडईत येण्याची सर्वोत्तम वेळ:**\n• **शिफारस केलेली वेळ:** **${data.recommendedSlot}**\n• **सल्ला:** ${data.reason}\n\n📊 सकाळी 10:30 ते 11:30 दरम्यान कमीत कमी गर्दी असते.`;
    } else if (l === "gu") {
      text = `🕒 **મંડીમાં પહોંચવાનો શ્રેષ્ઠ સમય:**\n• **સમય:** **${data.recommendedSlot}**\n• **સલાહ:** ${data.reason}\n\n📊 10:30 AM – 11:30 AM વચ્ચે સૌથી ઓછી ભીડ રહેશે.`;
    } else if (l === "te") {
      text = `🕒 **మార్కెట్‌కు రావడానికి ఉత్తమ సమయం:**\n• **సిఫార్సు చేయబడిన సమయం:** **${data.recommendedSlot}**\n• 10:30 AM – 11:30 AM సమయంలో రద్దీ తక్కువగా ఉంటుంది.`;
    } else if (l === "ta") {
      text = `🕒 **மண்டிக்கு வர சிறந்த நேரம்:**\n• **பரிந்துரைக்கப்பட்ட நேரம்:** **${data.recommendedSlot}**\n• 10:30 AM – 11:30 AM நேரத்தில் நெரிசல் குறைவாக இருக்கும்.`;
    } else if (l === "en") {
      text = `🕒 **Best Time to Arrive & Congestion Schedule:**\n• **Recommended Window:** **${data.recommendedSlot}**\n• **Reason:** ${data.reason}\n\n📊 **Hourly Rush:**\n• 09:00 AM – 10:00 AM: 🔴 High Rush (~35 mins wait)\n• 10:30 AM – 11:30 AM: 🟢 Optimal Window (~15 mins wait - Recommended)\n• 02:30 PM – 04:00 PM: 🟢 Fast Clearance (~12 mins wait)`;
    } else {
      text = `🕒 **मंडी पहुंचने का सबसे अच्छा समय व भीड़ सारणी:**\n• **सर्वोत्तम समय:** **${data.recommendedSlot}**\n• **सलाह:** ${data.reason}\n\n📊 **आज का अनुमानित भीड़ स्तर:**\n• 09:00 AM – 10:00 AM: 🔴 भारी भीड़ (~35 मिनट प्रतीक्षा)\n• 10:30 AM – 11:30 AM: 🟢 सबसे कम भीड़ (~15 मिनट प्रतीक्षा - अनुशंसित)\n• 02:30 PM – 04:00 PM: 🟢 त्वरित तुलाई (~12 मिनट प्रतीक्षा)`;
    }

    return {
      text,
      toolUsed: "get_best_time_to_visit",
      toolResult: data,
      menuOptions: [
        { label: "🎫 टोकन व कतार स्थिति", action: "टोकन स्थिति", icon: "🎫" },
        getBackOption(l),
      ],
    };
  }

  // 6. HELPLINE & GRIEVANCE (Option 6 / help / helpline / शिकायत / ਸਹਾਇਤਾ / ਸ਼ਿਕਾਇਤ / ફરિયાદ / ఫిర్యాదు / உதவி)
  if (
    q === "6" ||
    q.includes("helpline") ||
    q.includes("हेल्पलाइन") ||
    q.includes("help") ||
    q.includes("सहायता") ||
    q.includes("शिकायत") ||
    q.includes("ਸ਼ਿਕਾਇਤ") ||
    q.includes("ਤਕ੍ਰਾਰ") ||
    q.includes("ફરિયાદ") ||
    q.includes("ఫిర్యాదు") ||
    q.includes("புகார்") ||
    q.includes("অভিযোগ")
  ) {
    const helpData = executeTool("get_helpline_info", {}, context);

    let text = "";
    if (l === "pa") {
      text = `🚨 **ਕਿਸਾਨ ਹੈਲਪਲਾਈਨ ਤੇ ਸਹਾਇਤਾ ਕੇਂਦਰ:**\n• **ਕੌਮੀ ਕਿਸਾਨ ਕਾਲ ਸੈਂਟਰ:** 📞 1800-180-1551 (24x7 ਟੋਲ-ਫ਼੍ਰੀ)\n• **ਮੰਡੀ ਕੰਟਰੋਲ ਰੂਮ:** 📞 ${helpData.stateControlRoom}\n• **ਵ੍ਹਟਸਐਪ ਸਹਾਇਤਾ:** 📱 ${helpData.whatsappSupport}`;
    } else if (l === "mr") {
      text = `🚨 **शेतकरी हेल्पलाइन व तक्रार निवारण कक्ष:**\n• **राष्ट्रीय किसान कॉल सेंटर:** 📞 1800-180-1551 (24x7 टोल-फ्री)\n• **नियंत्रण कक्ष:** 📞 ${helpData.stateControlRoom}\n• **व्हॉट्सॲप सहाय्यता:** 📱 ${helpData.whatsappSupport}`;
    } else if (l === "gu") {
      text = `🚨 **ખેડૂત હેલ્પલાઇન અને સહાય કેન્દ્ર:**\n• **કિસાન કોલ સેન્ટર:** 📞 1800-180-1551 (24x7 ટોલ-ફ્રી)\n• **કંટ્રોલ રૂમ:** 📞 ${helpData.stateControlRoom}`;
    } else if (l === "bn") {
      text = `🚨 **কৃষক হেল্পলাইন ও অভিযোগ কেন্দ্র:**\n• **জাতীয় কিষাণ কল সেন্টার:** 📞 1800-180-1551 (টোল-ফ্রি ২৪x৭)\n• **নিয়ন্ত্রণ কক্ষ:** 📞 ${helpData.stateControlRoom}`;
    } else if (l === "te") {
      text = `🚨 **రైతు హెల్ప్‌లైన్ & సహాయ కేంద్రం:**\n• **కిసాన్ కాల్ సెంటర్:** 📞 1800-180-1551 (24x7 టోల్-ఫ్రీ)\n• **కంట్రోల్ రూమ్:** 📞 ${helpData.stateControlRoom}`;
    } else if (l === "ta") {
      text = `🚨 **விவசாயி உதவி மையம் & புகார் பிரிவு:**\n• **விவசாயி அழைப்பு மையம்:** 📞 1800-180-1551 (24x7 கட்டணமில்லா எண்)\n• **கட்டுப்பாட்டு அறை:** 📞 ${helpData.stateControlRoom}`;
    } else if (l === "en") {
      text = `🚨 **Farmer Helpline & Grievance Desk:**\n• **National Kisan Call Centre:** 📞 1800-180-1551 (24x7 Toll-Free)\n• **Mandi State Control Room:** 📞 ${helpData.stateControlRoom}\n• **WhatsApp Support:** 📱 ${helpData.whatsappSupport}\n• **Email:** ✉️ ${helpData.email}`;
    } else {
      text = `🚨 **किसान हेल्पलाइन एवं समाधान डेस्क:**\n• **राष्ट्रीय किसान कॉल सेंटर:** 📞 1800-180-1551 (24x7 टोल-फ्री)\n• **मंडी राज्य नियंत्रण कक्ष:** 📞 ${helpData.stateControlRoom}\n• **मंडीमित्र हेल्पलाइन:** 📱 ${helpData.whatsappSupport}\n• **ईमेल सहायता:** ✉️ ${helpData.email}`;
    }

    return {
      text,
      toolUsed: "get_helpline_info",
      toolResult: helpData,
      menuOptions: [
        { label: "📞 1800-180-1551", action: "call", phone: "18001801551", variant: "call" },
        getBackOption(l),
      ],
    };
  }

  // DEFAULT / MAIN MENU
  let text = "";
  if (l === "pa") {
    text = `🌾 **ਮੰਡੀਮਿੱਤਰ ਕਿਸਾਨ ਸੇਵਾ:**\nਸਹਾਇਤਾ ਲਈ ਹੇਠਾਂ ਦਿੱਤੇ ਕਿਸੇ ਵੀ ਵਿਕਲਪ 'ਤੇ ਟੈਪ ਕਰੋ:`;
  } else if (l === "mr") {
    text = `🌾 **मंडीमित्र शेतकरी सेवा:**\nमदतीसाठी खालीलपैकी कोणत्याही पर्यायावर टॅप करा:`;
  } else if (l === "gu") {
    text = `🌾 **મંડીમિત્ર ખેડૂત સેવા:**\nસહાય માટે નીચે આપેલ કોઈપણ વિકલ્પ પર ક્લિક કરો:`;
  } else if (l === "bn") {
    text = `🌾 **মান্ডিমিত্র কৃষক সেবা:**\nসহায়তার জন্য নিচের যে কোনো সেবায় চাপ দিন:`;
  } else if (l === "te") {
    text = `🌾 **మండిమిత్ర రైతు సేవలు:**\nసహాయం కోసం క్రింది ఎంపికలలో దేనినైనా ఎంచుకోండి:`;
  } else if (l === "ta") {
    text = `🌾 **மண்டிமித்ரா விவசாயி சேவை:**\nஉதவிக்கு கீழே உள்ள விருப்பங்களில் ஒன்றைத் தட்டவும்:`;
  } else if (l === "en") {
    text = `🌾 **MandiMitra Farmer Services:**\nPlease tap any service below to proceed:`;
  } else {
    text = `🌾 **मंडीमित्र किसान सेवा:**\nकृपया सहायता के लिए नीचे दिए गए किसी भी विकल्प पर टैप करें:`;
  }

  return {
    text,
    toolUsed: "main_menu",
    toolResult: null,
    menuOptions: getMainMenuOptions(l),
  };
}

