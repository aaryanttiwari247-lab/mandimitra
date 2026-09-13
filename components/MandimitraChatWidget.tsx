"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/context/language-context";
import { getFarmerSession, FarmerUser } from "@/lib/farmer-auth";
import {
  startSpeechRecognition,
  VoiceNoteRecorder,
  speakText,
  stopSpeaking,
} from "@/lib/voice-utils";
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  X,
  Sparkles,
  Sprout,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Check,
  Radio,
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Globe,
  LayoutGrid,
  PhoneCall,
} from "lucide-react";
import {
  getMainMenuOptions,
  MenuItemOption,
  SUPPORTED_LANGUAGES,
  SupportedLanguageCode,
  detectLanguageFromText,
} from "@/lib/ai-assistant-tools";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  audioUrl?: string;
  audioDuration?: number;
  demoMode?: boolean;
  menuOptions?: MenuItemOption[];
  timestamp: string;
}

const LANGUAGE_SWITCH_MESSAGES: Record<SupportedLanguageCode, string> = {
  hi: "नमस्ते किसान भाई! भाषा बदलकर 'हिन्दी' कर दी गई है। सहायता के लिए नीचे दिए गए किसी भी विकल्प पर टैप करें या बोलें:",
  pa: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਕਿਸਾਨ ਵੀਰੋ! ਬੋਲੀ ਬਦਲ ਕੇ 'ਪੰਜਾਬੀ' ਕਰ ਦਿੱਤੀ ਗਈ ਹੈ। ਸਹਾਇਤਾ ਲਈ ਹੇਠਾਂ ਦਿੱਤੇ ਕਿਸੇ ਵੀ ਵਿਕਲਪ 'ਤੇ ਟੈਪ ਕਰੋ ਜਾਂ ਬੋਲੋ:",
  mr: "नमस्कार शेतकरी बंधूंनो! भाषा बदलून 'मराठी' केली आहे. मदतीसाठी खालील पर्यायांवर टॅप करा किंवा बोला:",
  gu: "નમસ્તે ખેડૂત મિત્ર! ભાષા બદલીને 'ગુજરાતી' કરવામાં આવી છે. સહાય માટે નીચે આપેલા વિકલ્પ પર ક્લિક કરો અથવા બોલો:",
  bn: "নমস্কার কৃষক ভাই! ভাষা পরিবর্তন করে 'বাংলা' করা হয়েছে। সহায়তার জন্য নিচের যে কোনো সেবায় ক্লিক করুন বা বলুন:",
  te: "నమస్కారం రైతు సోదరులారా! భాష 'తెలుగు'గా మార్చబడింది. సహాయం కోసం క్రింది సేవలపై ట్యాప్ చేయండి లేదా మాట్లాడండి:",
  ta: "வணக்கம் விவசாய தோழரே! மொழி 'தமிழ்' என மாற்றப்பட்டுள்ளது. உதவிக்கு கீழே உள்ள சேவையை கிளிக் செய்யவும் அல்லது பேசவும்:",
  en: "Welcome farmer friend! Language changed to 'English'. Please tap any service below to proceed or speak your query:",
};

const INITIAL_GREETING_MESSAGES: Record<SupportedLanguageCode, string> = {
  hi: "नमस्ते किसान भाई! मैं मंडीहेल्प (MandiHelp) एआई खरीद सहायक हूँ। सहायता के लिए नीचे दिए गए किसी भी विकल्प पर टैप करें या बोलकर पूछें:",
  pa: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਕਿਸਾਨ ਵੀਰੋ! ਮੈਂ MandiHelp ਏ.ਆਈ. ਖਰੀਦ ਸਹਾਇਕ ਹਾਂ। ਸਹਾਇਤਾ ਲਈ ਹੇਠਾਂ ਦਿੱਤੇ ਕਿਸੇ ਵੀ ਵਿਕਲਪ 'ਤੇ ਟੈਪ ਕਰੋ ਜਾਂ ਬੋਲੋ:",
  mr: "नमस्कार शेतकरी बंधूंनो! मी MandiHelp एआय खरेदी सहाय्यक आहे. मदतीसाठी खालील पर्यायांवर टॅप करा किंवा बोलून विचारा:",
  gu: "નમસ્તે ખેડૂત મિત્ર! હું MandiHelp એઆઈ ખરીદ સહાયક છું. સહાય માટે નીચે આપેલા વિકલ્પ પર ક્લિક કરો અથવા બોલીને પૂછો:",
  bn: "নমস্কার কৃষক ভাই! আমি MandiHelp এআই সংগ্রহ সহকারী। সহায়তার জন্য নিচের যে কোনো সেবায় ক্লিক করুন বা বলুন:",
  te: "నమస్కారం రైతు సోదరులారా! నేను MandiHelp ఏఐ సేకరణ సహాయకుడిని. సహాయం కోసం క్రింది సేవలపై ట్యాప్ చేయండి లేదా మాట్లాడండి:",
  ta: "வணக்கம் விவசாய தோழரே! நான் MandiHelp ஏஐ கொள்முதல் உதவியாளர். உதவிக்கு கீழே உள்ள சேவையை கிளிக் செய்யவும் அல்லது பேசவும்:",
  en: "Welcome farmer friend! I am MandiHelp AI procurement companion. Please tap any service below to proceed or speak your query:",
};

const ERROR_MESSAGES: Record<SupportedLanguageCode, string> = {
  hi: "MandiHelp सहायक इस समय उत्तर देने में असमर्थ है। कृपया दोबारा प्रयास करें।",
  pa: "MandiHelp ਸਹਾਇਕ ਇਸ ਵੇਲੇ ਜਵਾਬ ਦੇਣ ਵਿੱਚ ਅਸਮਰੱਥ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
  mr: "MandiHelp सहाय्यक सध्या उत्तर देण्यास असमर्थ आहे. कृपया पुन्हा प्रयत्न करा.",
  gu: "MandiHelp સહાયક હાલમાં જવાબ આપવામાં અસમર્થ છે. કૃપા કરીને ફરી પ્રયાસ કરો.",
  bn: "MandiHelp সহকারী এই মুহূর্তে উত্তর দিতে পারছে না। অনুগ্রহ করে আবার চেষ্টা করুন।",
  te: "MandiHelp సహాయకుడు ప్రస్తుతం స్పందించలేకపోతున్నారు. దయచేసి మళ్ళీ ప్రయత్నించండి.",
  ta: "MandiHelp உதவியாளர் தற்போது பதிலளிக்க முடியவில்லை. தயவுசெய்து மீண்டும் முயற்செய்து பார்க்கவும்.",
  en: "MandiHelp is temporarily unavailable. Please try again.",
};

const getLocalizedQuickActions = (lang: SupportedLanguageCode) => {
  switch (lang) {
    case "pa":
      return [
        { label: "ਬੋਲੀ ਬਦਲੋ", prompt: "ਬੋਲੀ" },
        { label: "ਮੁੱਖ ਮੈਨੂ", prompt: "ਮੈਨੂ" },
        { label: "ਕੇਂਦਰ ਸੰਪਰਕ", prompt: "ਕੇਂਦਰ ਸੰਪਰਕ" },
        { label: "ਮੇਰਾ ਟੋਕਨ", prompt: "ਟੋਕਨ ਸਥਿਤੀ" },
        { label: "ਤੁਲਾਈ ਤੇ ਵਜ਼ਨ", prompt: "ਤੁਲਾਈ ਤੇ ਵਜ਼ਨ" },
        { label: "ਐੱਮ.ਐੱਸ.ਪੀ. ਭੁਗਤਾਨ", prompt: "ਐੱਮਐੱਸਪੀ ਭੁਗਤਾਨ" },
        { label: "ਆਉਣ ਦਾ ਸਮਾਂ", prompt: "ਆਉਣ ਦਾ ਸਹੀ ਸਮਾਂ" },
        { label: "ਹੈਲਪਲਾਈਨ", prompt: "ਕਿਸਾਨ ਹੈਲਪਲਾਈਨ" },
      ];
    case "mr":
      return [
        { label: "भाषा निवडा", prompt: "भाषा" },
        { label: "मुख्य मेनू", prompt: "मेनू" },
        { label: "केंद्र संपर्क", prompt: "केंद्र संपर्क" },
        { label: "माझे टोकन", prompt: "टोकन स्थिती" },
        { label: "वजन तपासणी", prompt: "वजन तपासणी" },
        { label: "हमीभाव पेमेंट", prompt: "हमीभाव पेमेंट" },
        { label: "येण्याची वेळ", prompt: "येण्याची वेळ" },
        { label: "हेल्पलाइन", prompt: "शेतकरी हेल्पलाइन" },
      ];
    case "gu":
      return [
        { label: "ભાષા બદલો", prompt: "ભાષા" },
        { label: "મુખ્ય મેનુ", prompt: "મેનુ" },
        { label: "કેન્દ્ર સંપર્ક", prompt: "કેન્દ્ર સંપર્ક" },
        { label: "મારું ટોકન", prompt: "ટોકન સ્થિતિ" },
        { label: "તોલ વજન", prompt: "તોલ વજન" },
        { label: "ટેકાના ભાવ", prompt: "ટેકાના ભાવ ચૂકવણી" },
        { label: "આવવાનો સમય", prompt: "આવવાનો સમય" },
        { label: "હેલ્પલાઇન", prompt: "ખેડૂત હેલ્પલાઇન" },
      ];
    case "te":
      return [
        { label: "భాష మార్చండి", prompt: "భాష" },
        { label: "ప్రధాన మెనూ", prompt: "మెనూ" },
        { label: "కేంద్రం సంప్రదించండి", prompt: "కేంద్రం సంప్రదించండి" },
        { label: "నా టోకెన్", prompt: "టోకెన్ స్థితి" },
        { label: "తూకం తనిఖీ", prompt: "తూకం తనిఖీ" },
        { label: "ఎంఎస్‌పి చెల్లింపు", prompt: "ఎంఎస్‌పి చెల్లింపు" },
        { label: "రాక సమయం", prompt: "రాక సమయం" },
        { label: "హెల్ప్‌లైన్", prompt: "రైతు హెల్ప్‌లైన్" },
      ];
    case "ta":
      return [
        { label: "மொழி மாற்று", prompt: "மொழி" },
        { label: "முதன்மை பட்டியல்", prompt: "பட்டியல்" },
        { label: "மைய தொடர்பு", prompt: "மைய தொடர்பு" },
        { label: "என் டோக்கன்", prompt: "டோக்கன் நிலை" },
        { label: "எடை பரிசோதனை", prompt: "எடை பரிசோதனை" },
        { label: "எம்எஸ்பி பணம்", prompt: "எம்எஸ்பி பணம்" },
        { label: "வருகை நேரம்", prompt: "வருகை நேரம்" },
        { label: "உதவி மையம்", prompt: "விவசாயி உதவி" },
      ];
    case "bn":
      return [
        { label: "ভাষা পরিবর্তন", prompt: "ভাষা" },
        { label: "প্রধান মেনু", prompt: "মেনু" },
        { label: "কেন্দ্রে যোগাযোগ", prompt: "কেন্দ্রে যোগাযোগ" },
        { label: "আমার টোকেন", prompt: "টোকেন অবস্থা" },
        { label: "ফসলের ওজন", prompt: "ফসলের ওজন" },
        { label: "এমএসপি ও পেমেন্ট", prompt: "এমএসপি ও পেমেন্ট" },
        { label: "আসার সেরা সময়", prompt: "আসার সেরা সময়" },
        { label: "হেল্পলাইন", prompt: "কৃষক হেল্পলাইন" },
      ];
    case "en":
      return [
        { label: "Language", prompt: "language" },
        { label: "Main Menu", prompt: "menu" },
        { label: "Contact Centre", prompt: "contact centre" },
        { label: "My Token", prompt: "token status" },
        { label: "Weighbridge & Quality", prompt: "weighbridge quality" },
        { label: "MSP Payment", prompt: "msp payment" },
        { label: "Best Arrival Time", prompt: "best arrival time" },
        { label: "Kisan Helpline", prompt: "kisan helpline" },
      ];
    default: // hi
      return [
        { label: "भाषा बदलें", prompt: "भाषा" },
        { label: "मुख्य मेनू", prompt: "मेनू" },
        { label: "केंद्र संपर्क", prompt: "केंद्र संपर्क" },
        { label: "मेरा टोकन", prompt: "टोकन स्थिति" },
        { label: "तुलाई और वजन", prompt: "तुलाई और वजन" },
        { label: "एमएसपी भुगतान", prompt: "एमएसपी और भुगतान" },
        { label: "आने का समय", prompt: "आने का सही समय" },
        { label: "किसान हेल्पलाइन", prompt: "किसान हेल्पलाइन" },
      ];
  }
};

const getListenButtonLabel = (lang: SupportedLanguageCode, isSpeaking: boolean) => {
  if (isSpeaking) {
    switch (lang) {
      case "pa":
        return "ਬੋਲ ਰਿਹਾ ਹੈ...";
      case "mr":
        return "बोलत आहे...";
      case "gu":
        return "બોલી રહ્યું છે...";
      case "te":
        return "మాట్లాడుతోంది...";
      case "ta":
        return "பேசுகிறது...";
      case "bn":
        return "বলছে...";
      case "en":
        return "Speaking...";
      default:
        return "बोल रहा है...";
    }
  }
  switch (lang) {
    case "pa":
      return "ਸੁਣੋ";
    case "mr":
      return "ऐका";
    case "gu":
      return "સાંભળો";
    case "te":
      return "వినండి";
    case "ta":
      return "கேட்க";
    case "bn":
      return "শুনুন";
    case "en":
      return "Listen";
    default:
      return "सुनें";
  }
};

export function openVoiceAssistant() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("openMandimitraVoiceAssistant"));
  }
}

export function MandimitraChatWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const { t, language, setLanguage } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [chatLanguage, setChatLanguage] = useState<SupportedLanguageCode>(() => {
    if (language === "bn") return "bn";
    if (language === "en") return "en";
    return "hi";
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  // Synchronize chatLanguage when global language changes
  useEffect(() => {
    if (language === "hi" || language === "bn" || language === "en") {
      setChatLanguage(language);
    }
  }, [language]);

  // Switch chat and application language with instant localized welcome message
  const handleLanguageChange = (newLang: SupportedLanguageCode) => {
    setChatLanguage(newLang);
    if (newLang === "hi" || newLang === "en" || newLang === "bn") {
      setLanguage(newLang as any);
    }
    stopSpeaking();

    const switchMsg = LANGUAGE_SWITCH_MESSAGES[newLang] || LANGUAGE_SWITCH_MESSAGES.hi;

    const newMsg: ChatMessage = {
      id: `lang-switch-${Date.now()}`,
      role: "assistant",
      content: switchMsg,
      menuOptions: getMainMenuOptions(newLang),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMsg]);
  };

  // Dictation / Speech Recognition State
  const [isDictating, setIsDictating] = useState(false);
  const dictationRef = useRef<{ stop: () => void } | null>(null);

  // Voice Note Recording State (MediaRecorder)
  const [isRecordingNote, setIsRecordingNote] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recorderRef = useRef<VoiceNoteRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio Playback State for recorded audio notes
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Messages list
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Farmer session & active booking cache
  const [farmer, setFarmer] = useState<FarmerUser | null>(null);
  const [activeBooking, setActiveBooking] = useState<any>(null);

  // Load session & active booking strictly matching logged-in farmer
  const loadFarmerContext = useCallback(() => {
    try {
      // If user is currently on the login page, they are unauthenticated
      if (pathname?.startsWith("/farmer/login")) {
        setFarmer(null);
        setActiveBooking(null);
        return;
      }

      const f = getFarmerSession();
      setFarmer(f);

      if (!f || !f.mobile) {
        setActiveBooking(null);
        return;
      }

      const bRaw = localStorage.getItem("smartProcurementBooking");
      if (bRaw) {
        const parsed = JSON.parse(bRaw);
        // Strictly verify that the booking belongs to this logged-in farmer
        const belongs =
          (parsed.farmerMobile && f.mobile && String(parsed.farmerMobile) === String(f.mobile)) ||
          (parsed.farmerId &&
            (parsed.farmerId === f.farmerId ||
              parsed.farmerId === f.farmerCode ||
              parsed.farmerId === `FMR${f.mobile.slice(-4)}`));

        // ACTIVE booking must not be CANCELLED, COMPLETED, or REJECTED!
        const isActiveStatus =
          parsed.status !== "CANCELLED" &&
          parsed.status !== "COMPLETED" &&
          parsed.status !== "REJECTED";

        if (belongs && isActiveStatus && parsed.token) {
          setActiveBooking(parsed);
        } else {
          setActiveBooking(null);
          // If stored booking belongs to another farmer, clean it up
          if (!belongs) {
            localStorage.removeItem("smartProcurementBooking");
          }
        }
      } else {
        setActiveBooking(null);
      }
    } catch {
      setFarmer(null);
      setActiveBooking(null);
    }
  }, [pathname]);

  useEffect(() => {
    loadFarmerContext();

    const handleOpen = () => {
      loadFarmerContext();
      setIsOpen(true);
    };

    window.addEventListener("openMandimitraVoiceAssistant", handleOpen);
    window.addEventListener("smartProcurementBookingUpdated", loadFarmerContext);
    return () => {
      window.removeEventListener("openMandimitraVoiceAssistant", handleOpen);
      window.removeEventListener("smartProcurementBookingUpdated", loadFarmerContext);
    };
  }, [loadFarmerContext]);

  // Initialize greeting message on first mount or language change
  useEffect(() => {
    const greetingText =
      INITIAL_GREETING_MESSAGES[chatLanguage] || INITIAL_GREETING_MESSAGES.hi;

    setMessages((prev) => {
      if (prev.length === 0) {
        return [
          {
            id: "greeting-1",
            role: "assistant",
            content: greetingText,
            menuOptions: getMainMenuOptions(chatLanguage),
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ];
      }
      return prev;
    });
  }, [chatLanguage]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, loading]);

  // Clean up audio on unmount or closing
  useEffect(() => {
    return () => {
      stopSpeaking();
      if (dictationRef.current) dictationRef.current.stop();
      if (recorderRef.current) recorderRef.current.cancel();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ============================================================
  // SEND MESSAGE TO BACKEND API
  // ============================================================
  const handleSend = async (
    textToSend?: string,
    audioNote?: { url: string; duration: number }
  ) => {
    const messageContent = (textToSend ?? input).trim();
    if (!messageContent && !audioNote) return;

    // Refresh context from localStorage before sending
    loadFarmerContext();

    // Auto-detect language from script
    const detected = detectLanguageFromText(messageContent);
    const activeLang = detected || chatLanguage;
    if (detected && detected !== chatLanguage) {
      setChatLanguage(detected);
      if (detected === "hi" || detected === "en" || detected === "bn") {
        setLanguage(detected as any);
      }
    }

    const userMsgId = `user-${Date.now()}`;
    const newMsg: ChatMessage = {
      id: userMsgId,
      role: "user",
      content: messageContent || (t("assistant.voiceNoteFromYou") || "आवाज संदेश"),
      audioUrl: audioNote?.url,
      audioDuration: audioNote?.duration,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    // Fresh synchronous lookup of current farmer & verified active booking from localStorage
    const isLoginPage = Boolean(pathname?.startsWith("/farmer/login"));
    const currentFarmer = isLoginPage ? null : getFarmerSession();
    const isFarmerLoggedIn = Boolean(currentFarmer && currentFarmer.mobile && !isLoginPage);
    let freshBooking: any = null;

    if (isFarmerLoggedIn && currentFarmer) {
      try {
        const bRaw = localStorage.getItem("smartProcurementBooking");
        if (bRaw) {
          const parsed = JSON.parse(bRaw);
          const belongs =
            (parsed.farmerMobile && currentFarmer.mobile && String(parsed.farmerMobile) === String(currentFarmer.mobile)) ||
            (parsed.farmerId &&
              (parsed.farmerId === currentFarmer.farmerId ||
                parsed.farmerId === currentFarmer.farmerCode ||
                parsed.farmerId === `FMR${currentFarmer.mobile.slice(-4)}`));

          const isActiveStatus =
            parsed.status !== "CANCELLED" &&
            parsed.status !== "COMPLETED" &&
            parsed.status !== "REJECTED";

          if (belongs && isActiveStatus && parsed.token) {
            freshBooking = parsed;
          }
        }
      } catch {}
    }

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          farmerId: isFarmerLoggedIn ? currentFarmer?.farmerId : undefined,
          farmerName: isFarmerLoggedIn ? currentFarmer?.name : undefined,
          farmerMobile: isFarmerLoggedIn ? currentFarmer?.mobile : undefined,
          activeBooking: freshBooking,
          language: activeLang,
          isLoggedIn: isFarmerLoggedIn,
        }),
      });

      if (!res.ok) throw new Error("Failed to reach assistant server");

      const data = await res.json();
      const assistantMsgId = `asst-${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: data.text || "Records checked.",
        demoMode: Boolean(data.demoMode),
        menuOptions: Array.isArray(data.menuOptions) && data.menuOptions.length > 0 ? data.menuOptions : undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: ERROR_MESSAGES[activeLang] || ERROR_MESSAGES.hi,
        menuOptions: getMainMenuOptions(activeLang),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Handle clicking menu action or navigating to link (e.g. Book Slot)
  const handleOptionClick = (opt: MenuItemOption) => {
    if (opt.link) {
      router.push(opt.link);
      setIsOpen(false);
      return;
    }
    handleSend(opt.action);
  };

  // ============================================================
  // VOICE DICTATION (SPEECH-TO-TEXT)
  // ============================================================
  const toggleDictation = () => {
    if (isDictating) {
      if (dictationRef.current) dictationRef.current.stop();
      setIsDictating(false);
      return;
    }

    stopSpeaking();
    setIsDictating(true);

    dictationRef.current = startSpeechRecognition(chatLanguage, {
      onTranscript: (transcript, isFinal) => {
        setInput(transcript);
        if (isFinal) {
          setIsDictating(false);
          // Auto-send when final transcript recognized
          setTimeout(() => {
            handleSend(transcript);
          }, 350);
        }
      },
      onError: (err) => {
        console.warn("Speech recognition error:", err);
        setIsDictating(false);
      },
      onEnd: () => {
        setIsDictating(false);
      },
    });
  };

  // ============================================================
  // VOICE NOTE RECORDING (AUDIO NOTE)
  // ============================================================
  const startRecordingVoiceNote = async () => {
    stopSpeaking();
    try {
      const rec = new VoiceNoteRecorder();
      recorderRef.current = rec;
      await rec.start();

      setIsRecordingNote(true);
      setRecordingSeconds(0);

      // Start duration counter
      timerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);

      // Start recognition in background to transcribe the audio note content
      startSpeechRecognition(chatLanguage, {
        onTranscript: (transcript) => {
          setInput(transcript);
        },
        onError: () => {},
        onEnd: () => {},
      });
    } catch (err: any) {
      alert(err?.message || "Microphone access denied or not supported.");
      setIsRecordingNote(false);
    }
  };

  const stopAndSendVoiceNote = async () => {
    if (!recorderRef.current) return;
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const note = await recorderRef.current.stop();
      setIsRecordingNote(false);
      const transcribed = input.trim();
      handleSend(transcribed || (t("assistant.voiceNoteFromYou") || "आवाज संदेश"), {
        url: note.url,
        duration: note.durationSeconds,
      });
    } catch {
      setIsRecordingNote(false);
    }
  };

  const cancelVoiceNote = () => {
    if (recorderRef.current) recorderRef.current.cancel();
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecordingNote(false);
    setRecordingSeconds(0);
  };

  // ============================================================
  // AUDIO NOTE PLAYBACK
  // ============================================================
  const playAudioNote = (id: string, url: string) => {
    if (playingAudioId === id) {
      audioPlayerRef.current?.pause();
      setPlayingAudioId(null);
      return;
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }

    const audio = new Audio(url);
    audioPlayerRef.current = audio;
    setPlayingAudioId(id);

    audio.onended = () => {
      setPlayingAudioId(null);
    };

    audio.onerror = () => {
      setPlayingAudioId(null);
    };

    audio.play();
  };

  // ============================================================
  // SPEAK / STOP ASSISTANT SPEECH
  // ============================================================
  const toggleSpeakMessage = (id: string, text: string) => {
    if (speakingMsgId === id) {
      stopSpeaking();
      setSpeakingMsgId(null);
      return;
    }

    setSpeakingMsgId(id);
    speakText(text, chatLanguage, () => {
      setSpeakingMsgId(null);
    });
  };

  // Quick Action Chips Configuration
  const quickActions = getLocalizedQuickActions(chatLanguage);

  // Do not show widget on the landing / first page
  if (pathname === "/") {
    return null;
  }

  return (
    <>
      {/* ======================================================
          FLOATING ACTION BUTTON (TRIGGER)
      ====================================================== */}
      {!isOpen && (
        <button
          onClick={() => {
            loadFarmerContext();
            setIsOpen(true);
          }}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-[#2E7D32] px-3.5 py-2 text-white shadow-xl transition hover:bg-[#256428] hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30 print:hidden text-xs sm:text-sm font-bold"
          title={t("assistant.floatingBtn") || "MandiHelp"}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
          </span>

          <div className="flex items-center gap-1.5 font-bold">
            <Sprout className="h-4 w-4" />
            <span>{t("assistant.floatingBtnShort") || "MandiHelp"}</span>
          </div>

          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
            <Mic className="h-3.5 w-3.5" />
          </div>
        </button>
      )}

      {/* ======================================================
          EXPANDABLE CHAT & VOICE DRAWER
      ====================================================== */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-end justify-end p-0 sm:p-4 bg-black/30 backdrop-blur-xs sm:bg-transparent sm:backdrop-blur-none print:hidden pointer-events-none">
          <div className="pointer-events-auto relative flex flex-col w-full sm:w-[350px] h-[78vh] sm:h-[480px] max-h-[500px] bg-white rounded-t-2xl sm:rounded-2xl border border-gray-200 shadow-xl overflow-hidden animate-in slide-in-from-bottom-3 duration-200">
            {/* HEADER */}
            <div className="flex items-center justify-between bg-[#2E7D32] px-3 py-2 text-white">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-white shadow-xs">
                  <Sprout className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <h3 className="font-bold text-xs sm:text-sm leading-tight">
                      {t("assistant.title") || "MandiHelp"}
                    </h3>
                  </div>
                  <p className="text-[9.5px] text-emerald-100 font-medium">
                    {chatLanguage === "pa"
                      ? "ਖਰੀਦ ਸਹਾਇਕ"
                      : chatLanguage === "mr"
                      ? "खरेदी सहाय्यक"
                      : chatLanguage === "gu"
                      ? "ખરીદ સહાયક"
                      : chatLanguage === "te"
                      ? "సేకరణ సహాయకుడు"
                      : chatLanguage === "ta"
                      ? "கொள்முதல் உதவியாளர்"
                      : chatLanguage === "bn"
                      ? "সংগ্রহ সহকারী"
                      : chatLanguage === "en"
                      ? "Procurement AI"
                      : "खरीद सहायक"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* IN-CHAT MULTILINGUAL LANGUAGE SELECTOR TRIGGER */}
                <button
                  type="button"
                  onClick={() => setShowLanguageMenu((prev) => !prev)}
                  className="flex items-center gap-1 bg-black/25 hover:bg-black/35 active:bg-black/45 text-white text-[10.5px] font-bold px-2 py-1 rounded-lg border border-white/15 transition shadow-2xs"
                  title="भाषा चुनें / Select Language"
                >
                  <Globe className="h-3 w-3 text-emerald-200" />
                  <span>{SUPPORTED_LANGUAGES.find((l) => l.code === chatLanguage)?.nativeName || "हिन्दी"}</span>
                  <ChevronDown
                    className={`h-2.5 w-2.5 text-emerald-100 transition-transform duration-150 ${
                      showLanguageMenu ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* CLOSE BUTTON */}
                <button
                  onClick={() => {
                    stopSpeaking();
                    setShowLanguageMenu(false);
                    setIsOpen(false);
                  }}
                  className="flex h-6.5 w-6.5 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition text-white"
                  title={t("assistant.close") || "Close"}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* MULTILINGUAL LANGUAGE SELECTOR MODAL OVERLAY */}
            {showLanguageMenu && (
              <div className="absolute inset-x-0 top-[45px] bottom-0 z-40 bg-white/95 backdrop-blur-sm p-3 flex flex-col animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <div className="flex items-center gap-1.5">
                    <Globe className="h-4 w-4 text-[#2E7D32]" />
                    <h4 className="font-bold text-xs text-gray-900">
                      अपनी भाषा चुनें / Choose Language
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLanguageMenu(false)}
                    className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <p className="text-[10px] text-gray-500 mt-1.5 mb-2 font-medium">
                  8 प्रमुख भारतीय भाषाओं में संपूर्ण आवाज एवं मेनू सहायता:
                </p>

                <div className="grid grid-cols-2 gap-1.5 overflow-y-auto flex-1 pr-0.5">
                  {SUPPORTED_LANGUAGES.map((item) => {
                    const isSelected = chatLanguage === item.code;
                    return (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => {
                          handleLanguageChange(item.code);
                          setShowLanguageMenu(false);
                        }}
                        className={`flex items-center justify-between p-2 rounded-xl border text-left transition shadow-2xs ${
                          isSelected
                            ? "border-[#2E7D32] bg-[#E8F5E9] text-[#2E7D32] ring-1 ring-[#2E7D32]"
                            : "border-gray-200 bg-white hover:border-[#2E7D32]/50 hover:bg-gray-50 text-gray-800"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-xs leading-tight">
                              {item.nativeName}
                            </span>
                          </div>
                          <p className="text-[9.5px] text-gray-500 mt-0.5 font-medium">
                            {item.englishName}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <span
                            className={`text-[8.5px] font-extrabold px-1 py-0.5 rounded ${
                              isSelected
                                ? "bg-[#2E7D32] text-white"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {item.badge}
                          </span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-[#2E7D32]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2 pt-2 border-t border-gray-100 text-center">
                  <p className="text-[9.5px] text-gray-400">
                    आप जिस भाषा में बोलेंगे या लिखेंगे, सहायक स्वतः पहचान कर उत्तर देगा।
                  </p>
                </div>
              </div>
            )}

            {/* QUICK ACTIONS ROW */}
            <div className="border-b border-gray-100 bg-gray-50/80 px-2.5 py-1.5">
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={loading || isRecordingNote}
                    onClick={() => {
                      if (
                        action.prompt === "language" ||
                        action.prompt === "भाषा" ||
                        action.prompt === "ਬੋਲੀ" ||
                        action.prompt === "ભાષા" ||
                        action.prompt === "భాష" ||
                        action.prompt === "மொழி"
                      ) {
                        setShowLanguageMenu((prev) => !prev);
                      } else {
                        handleSend(action.prompt);
                      }
                    }}
                    className="flex shrink-0 items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[10.5px] font-semibold text-gray-700 shadow-2xs hover:border-[#2E7D32] hover:bg-[#E8F5E9] hover:text-[#2E7D32] transition disabled:opacity-50"
                  >
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* MESSAGES LIST */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#F9FBF8]">
              {messages.map((m) => {
                const isUser = m.role === "user";
                const isSpeakingThis = speakingMsgId === m.id;

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`relative ${
                        m.menuOptions && m.menuOptions.length >= 4 ? "w-full max-w-[96%]" : "max-w-[88%]"
                      } rounded-xl px-3 py-2 text-xs leading-relaxed shadow-2xs ${
                        isUser
                          ? "bg-[#2E7D32] text-white rounded-br-xs"
                          : "bg-white text-gray-900 border border-gray-200/80 rounded-bl-xs"
                      }`}
                    >
                      {/* AUDIO NOTE BUBBLE (IF USER SENT A VOICE MESSAGE) */}
                      {m.audioUrl && (
                        <div className="mb-1.5 flex items-center gap-2 rounded-lg bg-black/15 p-2">
                          <button
                            type="button"
                            onClick={() => playAudioNote(m.id, m.audioUrl!)}
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[#2E7D32] shadow-xs"
                          >
                            {playingAudioId === m.id ? (
                              <Pause className="h-3 w-3" />
                            ) : (
                              <Play className="h-3 w-3 ml-0.5" />
                            )}
                          </button>
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-[10px] font-bold text-white/90">
                              <span>{t("assistant.voiceNoteFromYou") || "आवाज संदेश"}</span>
                              <span>0:0{m.audioDuration || 3}</span>
                            </div>
                            <div className="mt-0.5 flex items-center gap-0.5">
                              {[35, 60, 40, 80, 50, 90, 30, 70, 45, 65, 85, 40].map((h, i) => (
                                <span
                                  key={i}
                                  className={`w-0.5 rounded-full bg-white/70 transition-all ${
                                    playingAudioId === m.id ? "animate-pulse" : ""
                                  }`}
                                  style={{ height: `${h * 0.14}px` }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TEXT CONTENT */}
                      <p className="whitespace-pre-line">{m.content}</p>

                      {/* RICH CLICKABLE SERVICE MENU CARDS */}
                      {m.menuOptions && m.menuOptions.length >= 4 ? (
                        <div className="mt-2.5 space-y-1.5 pt-1.5 border-t border-gray-100">
                          {m.menuOptions.map((opt, oIdx) => (
                            <div key={oIdx} className="group flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={loading || isRecordingNote}
                                onClick={() => handleOptionClick(opt)}
                                className={`flex-1 flex items-center justify-between rounded-xl border p-2 text-left transition shadow-2xs active:scale-[0.99] disabled:opacity-50 ${
                                  opt.variant === "primary"
                                    ? "border-emerald-500 bg-emerald-600 text-white hover:bg-emerald-700"
                                    : "border-emerald-200/90 bg-emerald-50/60 hover:border-emerald-500 hover:bg-emerald-100/70"
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg shadow-xs ${
                                    opt.variant === "primary" ? "bg-white/20 text-white" : "bg-emerald-700 text-white"
                                  }`}>
                                    {opt.phone ? (
                                      <PhoneCall className="h-3.5 w-3.5" />
                                    ) : opt.link ? (
                                      <Check className="h-3.5 w-3.5" />
                                    ) : (
                                      <ChevronRight className="h-3.5 w-3.5" />
                                    )}
                                  </span>
                                  <div className="min-w-0">
                                    <p className={`text-[11.5px] font-bold leading-tight ${
                                      opt.variant === "primary" ? "text-white" : "text-gray-900"
                                    }`}>
                                      {opt.label}
                                    </p>
                                    {opt.description && (
                                      <p className={`text-[9.5px] leading-tight mt-0.5 truncate ${
                                        opt.variant === "primary" ? "text-emerald-100" : "text-gray-600"
                                      }`}>
                                        {opt.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <ChevronRight className={`h-3.5 w-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition shrink-0 ml-1.5 ${
                                  opt.variant === "primary" ? "text-white" : "text-emerald-700"
                                }`} />
                              </button>

                              {opt.phone && (
                                <a
                                  href={`tel:${opt.phone.replace(/[^0-9+]/g, "")}`}
                                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition active:scale-95 no-underline"
                                  title={language === "hi" ? "सीधा फोन कॉल करें" : language === "bn" ? "সরাসরি ফোন করুন" : "Direct Phone Call"}
                                >
                                  <PhoneCall className="h-4 w-4" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        m.menuOptions && m.menuOptions.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-gray-100 flex flex-wrap gap-1.5">
                            {m.menuOptions.map((opt, oIdx) => {
                              if (opt.phone) {
                                return (
                                  <a
                                    key={oIdx}
                                    href={`tel:${opt.phone.replace(/[^0-9+]/g, "")}`}
                                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10.5px] px-2.5 py-1.5 shadow-2xs transition active:scale-95 no-underline"
                                  >
                                    <PhoneCall className="h-3 w-3" />
                                    <span>{opt.label}</span>
                                  </a>
                                );
                              }
                              return (
                                <button
                                  key={oIdx}
                                  type="button"
                                  disabled={loading || isRecordingNote}
                                  onClick={() => handleOptionClick(opt)}
                                  className={`inline-flex items-center gap-1 rounded-lg border text-semibold text-[10.5px] px-2.5 py-1 shadow-2xs transition active:scale-95 disabled:opacity-50 text-left ${
                                    opt.variant === "primary"
                                      ? "border-emerald-600 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                      : "border-emerald-600/30 bg-emerald-50/90 hover:bg-emerald-100 text-emerald-950 font-semibold"
                                  }`}
                                >
                                  <span>{opt.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        )
                      )}

                      {/* FOOTER OF BUBBLE (TTS SPEAKER & TIMESTAMP) */}
                      <div
                        className={`mt-1 flex items-center justify-between text-[9px] ${
                          isUser ? "text-emerald-100" : "text-gray-400"
                        }`}
                      >
                        <span>{m.timestamp}</span>

                        {!isUser && (
                          <div className="flex items-center gap-1.5">
                            {m.demoMode && (
                              <span className="text-[8px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-1 py-0.2 rounded">
                                Verified Data
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => toggleSpeakMessage(m.id, m.content)}
                              className={`flex items-center gap-1 rounded px-2 py-0.5 font-bold text-[10px] transition border shadow-2xs ${
                                isSpeakingThis
                                  ? "bg-[#2E7D32] text-white border-[#2E7D32] animate-pulse"
                                  : "bg-emerald-50/90 text-emerald-800 border-emerald-300/70 hover:bg-emerald-100 hover:text-emerald-950"
                              }`}
                              title={
                                isSpeakingThis
                                  ? t("assistant.stopListeningTooltip") || "आवाज बंद करें"
                                  : t("assistant.listenTooltip") || "उत्तर सुनें"
                              }
                            >
                              <Volume2 className="h-3 w-3" />
                              <span>{getListenButtonLabel(chatLanguage, isSpeakingThis)}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* LOADING INDICATOR */}
              {loading && (
                <div className="flex items-start gap-1.5">
                  <div className="flex items-center gap-1.5 rounded-xl rounded-bl-xs border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] text-gray-500 shadow-2xs">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2E7D32] opacity-75"></span>
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#2E7D32]"></span>
                    </span>
                    <span>MandiHelp जाँच कर रहा है...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ==================================================
                RECORDING AUDIO VOICE NOTE OVERLAY
            ================================================== */}
            {isRecordingNote ? (
              <div className="border-t border-red-200 bg-red-50/90 p-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-red-600"></span>
                    </span>
                    <div>
                      <p className="text-[11px] font-extrabold text-red-900">
                        {t("assistant.recordingVoiceNote") || "रिकॉर्ड हो रहा है..."}
                      </p>
                      <p className="text-[10px] font-bold text-red-700">
                        00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={cancelVoiceNote}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-red-300 bg-white text-red-700 hover:bg-red-100 transition shadow-xs"
                      title={t("assistant.cancelRecording") || "रद्द करें"}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={stopAndSendVoiceNote}
                      className="flex items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-red-700 transition shadow-xs"
                    >
                      <Check className="h-3 w-3" />
                      <span>{t("assistant.sendVoiceNote") || "भेजें"}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* ==================================================
                  STANDARD INPUT & MIC BAR
              ================================================== */
              <div className="border-t border-gray-200 bg-white p-2">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center gap-1.5"
                >
                  {/* HOLD / TAP TO RECORD AUDIO VOICE NOTE */}
                  <button
                    type="button"
                    onClick={startRecordingVoiceNote}
                    disabled={loading || isDictating}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-gray-50 text-gray-700 hover:border-red-500 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-50"
                    title="Record voice audio note"
                  >
                    <Radio className="h-3.5 w-3.5" />
                  </button>

                  {/* SPEECH-TO-TEXT DICTATION BUTTON */}
                  <button
                    type="button"
                    onClick={toggleDictation}
                    disabled={loading}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                      isDictating
                        ? "bg-red-600 text-white animate-pulse"
                        : "border border-gray-300 bg-gray-50 text-gray-700 hover:border-[#2E7D32] hover:bg-[#E8F5E9] hover:text-[#2E7D32]"
                    }`}
                    title={isDictating ? "Stop Dictation" : "Dictate (Speech to Text)"}
                  >
                    <Mic className="h-3.5 w-3.5" />
                  </button>

                  {/* MAIN MENU SHORTCUT BUTTON */}
                  <button
                    type="button"
                    onClick={() => {
                      const menuWord =
                        chatLanguage === "pa"
                          ? "ਮੈਨੂ"
                          : chatLanguage === "gu"
                          ? "મેનુ"
                          : chatLanguage === "te"
                          ? "మెనూ"
                          : chatLanguage === "ta"
                          ? "பட்டியல்"
                          : chatLanguage === "bn"
                          ? "মেনু"
                          : chatLanguage === "en"
                          ? "menu"
                          : "मेनू";
                      handleSend(menuWord);
                    }}
                    disabled={loading || isRecordingNote}
                    className="flex h-8 px-2 shrink-0 items-center justify-center gap-1 rounded-lg border border-gray-300 bg-gray-50 text-gray-700 hover:border-[#2E7D32] hover:bg-[#E8F5E9] hover:text-[#2E7D32] transition disabled:opacity-50 text-[11px] font-bold"
                    title={chatLanguage === "en" ? "Open Main Menu" : "मुख्य मेनू खोलें"}
                  >
                    <LayoutGrid className="h-3.5 w-3.5 text-[#2E7D32]" />
                    <span className="hidden sm:inline">
                      {chatLanguage === "pa"
                        ? "ਮੈਨੂ"
                        : chatLanguage === "gu"
                        ? "મેનુ"
                        : chatLanguage === "te"
                        ? "మెనూ"
                        : chatLanguage === "ta"
                        ? "பட்டியல்"
                        : chatLanguage === "bn"
                        ? "মেনু"
                        : chatLanguage === "en"
                        ? "Menu"
                        : "मेनू"}
                    </span>
                  </button>

                  {/* TEXT INPUT */}
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      isDictating
                        ? chatLanguage === "pa"
                          ? "ਸੁਣ ਰਿਹਾ ਹਾਂ... ਬੋਲੋ ਜੀ"
                          : chatLanguage === "gu"
                          ? "સાંભળી રહ્યો છું... બોલો"
                          : chatLanguage === "mr"
                          ? "ऐकत आहे... बोला"
                          : chatLanguage === "te"
                          ? "వింటున్నాను... మాట్లాడండి"
                          : chatLanguage === "ta"
                          ? "கேட்கிறேன்... பேசுங்கள்"
                          : chatLanguage === "bn"
                          ? "শুনছি... বলুন"
                          : chatLanguage === "en"
                          ? "Listening... please speak"
                          : "सुन रहा हूँ... बोलिए"
                        : chatLanguage === "pa"
                        ? "ਸਵਾਲ ਬੋਲੋ ਜਾਂ ਲਿਖੋ..."
                        : chatLanguage === "gu"
                        ? "પ્રશ્ન બોલો અથવા લખો..."
                        : chatLanguage === "mr"
                        ? "प्रश्न बोला किंवा टाईप करा..."
                        : chatLanguage === "te"
                        ? "ప్రశ్న మాట్లాడండి లేదా టైప్ చేయండి..."
                        : chatLanguage === "ta"
                        ? "கேள்வியை பேசுங்கள் அல்லது தட்டச்சு செய்க..."
                        : chatLanguage === "bn"
                        ? "প্রশ্ন বলুন বা লিখুন..."
                        : chatLanguage === "en"
                        ? "Ask or speak your question..."
                        : "प्रश्न बोलें या लिखें..."
                    }
                    className="flex-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-gray-900 focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                  />

                  {/* SEND BUTTON */}
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2E7D32] text-white transition hover:bg-[#256428] disabled:opacity-40"
                    title="Send"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>

                {/* DISCLAIMER / FOOTER */}
                <p className="mt-1 text-center text-[9px] text-gray-400">
                  {t("assistant.disclaimer") || "🔒 Verified against official government procurement records."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
