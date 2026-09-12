"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
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
  VolumeX,
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
  LayoutGrid,
  PhoneCall,
} from "lucide-react";
import { getMainMenuOptions, MenuItemOption } from "@/lib/ai-assistant-tools";

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

export function openVoiceAssistant() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("openMandimitraVoiceAssistant"));
  }
}

export function MandimitraChatWidget() {
  const pathname = usePathname();
  const { t, language } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

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

  // Load session & active booking
  const loadFarmerContext = useCallback(() => {
    try {
      const f = getFarmerSession();
      setFarmer(f);

      const bRaw = localStorage.getItem("smartProcurementBooking");
      if (bRaw) {
        setActiveBooking(JSON.parse(bRaw));
      } else {
        setActiveBooking(null);
      }
    } catch {
      setFarmer(null);
      setActiveBooking(null);
    }
  }, []);

  useEffect(() => {
    loadFarmerContext();

    const handleOpen = () => {
      loadFarmerContext();
      setIsOpen(true);
    };

    window.addEventListener("openMandimitraVoiceAssistant", handleOpen);
    return () => {
      window.removeEventListener("openMandimitraVoiceAssistant", handleOpen);
    };
  }, [loadFarmerContext]);

  // Initialize greeting message on first mount or language change
  useEffect(() => {
    const greetingText =
      t("assistant.initialGreeting") ||
      (language === "hi"
        ? "नमस्ते किसान भाई! 🌾 मैं मंडीमित्र एआई सहायक हूँ। नीचे दिए गए मेनू में से किसी विकल्प को चुनें या बोलकर/लिखकर पूछें:"
        : language === "bn"
        ? "নমস্কার কৃষক ভাই! 🌾 আমি মান্ডিমিত্র সহকারী। নিচের মেনু থেকে নির্বাচন করুন বা বলুন:"
        : "Welcome farmer brother! 🌾 I am MandiMitra AI. Please select an option from the menu below or ask by typing/speaking:");

    setMessages((prev) => {
      if (prev.length === 0) {
        return [
          {
            id: "greeting-1",
            role: "assistant",
            content: greetingText,
            menuOptions: getMainMenuOptions(language),
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ];
      }
      return prev;
    });
  }, [t, language]);

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

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          farmerId: farmer?.farmerId,
          farmerName: farmer?.name,
          farmerMobile: farmer?.mobile,
          activeBooking,
          language,
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

      // Auto-speak reply if enabled
      if (autoSpeak && data.text) {
        setSpeakingMsgId(assistantMsgId);
        speakText(data.text, language, () => {
          setSpeakingMsgId(null);
        });
      }
    } catch {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content:
          language === "hi"
            ? "MandiMitra सहायक इस समय उत्तर देने में असमर्थ है। कृपया दोबारा प्रयास करें।"
            : language === "bn"
            ? "সহকারী এই মুহূর্তে উত্তর দিতে পারছে না। অনুগ্রহ করে আবার চেষ্টা করুন।"
            : "Assistant is temporarily unavailable. Please try again.",
        menuOptions: getMainMenuOptions(language),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
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

    dictationRef.current = startSpeechRecognition(language, {
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
      startSpeechRecognition(language, {
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
    speakText(text, language, () => {
      setSpeakingMsgId(null);
    });
  };

  // Quick Action Chips Configuration
  const quickActions = [
    {
      label: language === "hi" ? "📋 मुख्य मेनू" : language === "bn" ? "📋 প্রধান মেনু" : "📋 Main Menu",
      prompt: language === "hi" ? "मेनू" : language === "bn" ? "মেনু" : "menu",
      icon: "📋",
    },
    {
      label: language === "hi" ? "📞 केंद्र संपर्क" : language === "bn" ? "📞 কেন্দ্রে যোগাযোগ" : "📞 Contact Centre",
      prompt: language === "hi" ? "केंद्र संपर्क" : language === "bn" ? "কেন্দ্রে যোগাযোগ" : "contact centre",
      icon: "📞",
    },
    {
      label: t("assistant.chipToken") || "मेरा टोकन",
      prompt: t("assistant.promptToken") || "मेरा वर्तमान टोकन और कतार की स्थिति क्या है?",
      icon: "🎫",
    },
    {
      label: t("assistant.chipInspection") || "तुलाई और वजन",
      prompt: t("assistant.promptInspection") || "मेरी फसल की तुलाई और ग्रेडिंग की स्थिति क्या है?",
      icon: "⚖️",
    },
    {
      label: t("assistant.chipPayment") || "डीबीटी भुगतान",
      prompt: t("assistant.promptPayment") || "मेरी फसल का कुल भुगतान कितना है और खाते में कब आएगा?",
      icon: "💰",
    },
    {
      label: language === "hi" ? "🕒 आने का समय" : language === "bn" ? "🕒 আসার সেরা সময়" : "🕒 Best Arrival Time",
      prompt: language === "hi" ? "आने का सही समय" : language === "bn" ? "আসার সেরা সময়" : "best arrival time",
      icon: "🕒",
    },
    {
      label: language === "hi" ? "🚨 हेल्पलाइन" : language === "bn" ? "🚨 হেল্পলাইন" : "🚨 Helpline",
      prompt: language === "hi" ? "किसान हेल्पलाइन" : language === "bn" ? "কৃষক হেল্পলাইন" : "helpline",
      icon: "🚨",
    },
  ];

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
          title={t("assistant.floatingBtn") || "MandiMitra AI • Voice Help"}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
          </span>

          <div className="flex items-center gap-1.5 font-bold">
            <Sprout className="h-4 w-4" />
            <span>{t("assistant.floatingBtnShort") || "आवाज सहायता"}</span>
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
          <div className="pointer-events-auto flex flex-col w-full sm:w-[350px] h-[78vh] sm:h-[480px] max-h-[500px] bg-white rounded-t-2xl sm:rounded-2xl border border-gray-200 shadow-xl overflow-hidden animate-in slide-in-from-bottom-3 duration-200">
            {/* HEADER */}
            <div className="flex items-center justify-between bg-[#2E7D32] px-3.5 py-2.5 text-white">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-white shadow-xs">
                  <Sprout className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-xs sm:text-sm leading-tight">
                      {t("assistant.title") || "MandiMitra AI"}
                    </h3>
                  </div>
                  <p className="text-[10px] text-emerald-100 font-medium">
                    {t("assistant.subtitle") || "Procurement assistant"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* AUTO-SPEAK TOGGLE */}
                <button
                  type="button"
                  onClick={() => {
                    if (autoSpeak) stopSpeaking();
                    setAutoSpeak(!autoSpeak);
                  }}
                  className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
                    autoSpeak ? "bg-white/25 text-white" : "bg-white/10 text-white/50"
                  }`}
                  title={autoSpeak ? "Auto-Speak ON" : "Auto-Speak OFF"}
                >
                  {autoSpeak ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                </button>

                {/* CLOSE BUTTON */}
                <button
                  onClick={() => {
                    stopSpeaking();
                    setIsOpen(false);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition text-white"
                  title={t("assistant.close") || "Close"}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* QUICK ACTIONS ROW */}
            <div className="border-b border-gray-100 bg-gray-50/80 px-2.5 py-1.5">
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={loading || isRecordingNote}
                    onClick={() => handleSend(action.prompt)}
                    className="flex shrink-0 items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-700 shadow-2xs hover:border-[#2E7D32] hover:bg-[#E8F5E9] hover:text-[#2E7D32] transition disabled:opacity-50"
                  >
                    <span>{action.icon}</span>
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
                      className={`relative max-w-[88%] rounded-xl px-3 py-2 text-xs leading-relaxed shadow-2xs ${
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

                      {/* INTERACTIVE MENU OPTIONS PILLS */}
                      {m.menuOptions && m.menuOptions.length > 0 && (
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
                                onClick={() => handleSend(opt.action)}
                                className="inline-flex items-center gap-1 rounded-lg border border-emerald-600/30 bg-emerald-50/90 hover:bg-emerald-100 text-emerald-950 font-semibold text-[10.5px] px-2 py-1 shadow-2xs transition active:scale-95 disabled:opacity-50 text-left"
                              >
                                {opt.icon && <span>{opt.icon}</span>}
                                <span>{opt.label}</span>
                              </button>
                            );
                          })}
                        </div>
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
                              className={`flex items-center gap-0.5 rounded px-1 py-0.5 font-bold transition ${
                                isSpeakingThis
                                  ? "bg-[#2E7D32] text-white"
                                  : "hover:bg-gray-100 text-gray-500 hover:text-gray-800"
                              }`}
                              title={
                                isSpeakingThis
                                  ? t("assistant.stopListeningTooltip") || "आवाज बंद करें"
                                  : t("assistant.listenTooltip") || "उत्तर सुनें"
                              }
                            >
                              <Volume2 className="h-2.5 w-2.5" />
                              <span>{isSpeakingThis ? "बोल रहा है..." : "सुनें"}</span>
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
                    <span>MandiMitra जाँच कर रहा है...</span>
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
                    onClick={() => handleSend(language === "hi" ? "मेनू" : language === "bn" ? "মেনু" : "menu")}
                    disabled={loading || isRecordingNote}
                    className="flex h-8 px-2 shrink-0 items-center justify-center gap-1 rounded-lg border border-gray-300 bg-gray-50 text-gray-700 hover:border-[#2E7D32] hover:bg-[#E8F5E9] hover:text-[#2E7D32] transition disabled:opacity-50 text-[11px] font-bold"
                    title={language === "hi" ? "मुख्य मेनू खोलें" : language === "bn" ? "প্রধান মেনু" : "Open Main Menu"}
                  >
                    <LayoutGrid className="h-3.5 w-3.5 text-[#2E7D32]" />
                    <span className="hidden sm:inline">{language === "hi" ? "मेनू" : language === "bn" ? "মেনু" : "Menu"}</span>
                  </button>

                  {/* TEXT INPUT */}
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      isDictating
                        ? t("assistant.listening") || "सुन रहा हूँ... बोलिए"
                        : t("assistant.typePlaceholder") || "प्रश्न बोलें या लिखें..."
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
