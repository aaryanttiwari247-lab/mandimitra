"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  MessageSquare,
  Phone,
  CheckCircle2,
  X,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Send,
} from "lucide-react";
import { SmsRecord } from "@/lib/sms-service";

export function LiveSmsNotifier() {
  const [activeBanner, setActiveBanner] = useState<SmsRecord | null>(null);
  const [allSmsLogs, setAllSmsLogs] = useState<SmsRecord[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [gatewayInfo, setGatewayInfo] = useState<{
    provider: string;
    isLive: boolean;
    name: string;
  }>({
    provider: "SIMULATED",
    isLive: false,
    name: "Simulation (Demo Mode)",
  });

  // Test SMS form state inside drawer
  const [testMobile, setTestMobile] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const bannerTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Play synthetic pleasant notification chime using Web Audio API
  const playChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "triangle";

      // Pleasant two-tone chime (E5 -> B5)
      osc1.frequency.setValueAtTime(659.25, now);
      osc1.frequency.exponentialRampToValueAtTime(987.77, now + 0.12);

      osc2.frequency.setValueAtTime(329.63, now);
      osc2.frequency.exponentialRampToValueAtTime(493.88, now + 0.12);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.55);
      osc2.stop(now + 0.55);
    } catch {}
  }, [soundEnabled]);

  // Load initial logs and gateway info
  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/sms");
      const data = await res.json();
      if (data.success) {
        if (data.activeProvider) {
          setGatewayInfo(data.activeProvider);
        }
        if (Array.isArray(data.logs)) {
          setAllSmsLogs(data.logs);
        }
      }
    } catch {
      // Local fallback
      try {
        const raw = localStorage.getItem("smart_procurement_sms_history");
        if (raw) setAllSmsLogs(JSON.parse(raw));
      } catch {}
    }
  }, []);

  useEffect(() => {
    fetchLogs();

    // Listen for custom event triggered when SMS is dispatched
    const handleSmsEvent = (e: Event) => {
      const customEvent = e as CustomEvent<SmsRecord>;
      const record = customEvent.detail;
      if (record) {
        setAllSmsLogs((prev) => [record, ...prev.filter((item) => item.id !== record.id)]);
        setActiveBanner(record);
        playChime();

        if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
        bannerTimerRef.current = setTimeout(() => {
          setActiveBanner(null);
        }, 9000);
      }
    };

    window.addEventListener("mandimitra_sms_received", handleSmsEvent);

    return () => {
      window.removeEventListener("mandimitra_sms_received", handleSmsEvent);
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, [fetchLogs, playChime]);

  // Copy helper
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Extract OTP if present in message
  const extractOtp = (msg: string) => {
    const match = msg.match(/\b\d{6}\b/);
    return match ? match[0] : null;
  };

  // Send quick test SMS
  const handleSendTestSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testMobile || testMobile.replace(/\D/g, "").length !== 10) {
      setTestResult("Please enter a valid 10-digit mobile number.");
      return;
    }

    setTestSending(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/notifications/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: testMobile,
          message: `MandiMitra Test Alert: This is a test SMS notification from MandiMitra Government of MP portal. System operational at ${new Date().toLocaleTimeString()}.`,
          type: "FARMER_OTP",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult(`SMS sent successfully via ${data.provider} (${data.status})`);
        fetchLogs();
      } else {
        setTestResult(`Error: ${data.error || data.message || "Failed to dispatch"}`);
      }
    } catch (err: any) {
      setTestResult(`Failed to connect: ${err?.message}`);
    } finally {
      setTestSending(false);
    }
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. TOP SMARTPHONE NOTIFICATION BANNER (SLIDES DOWN ON INCOMING SMS)       */}
      {/* ========================================================================= */}
      {activeBanner && (
        <aside
          role="status"
          aria-live="polite"
          aria-label="New SMS Alert"
          className="fixed top-4 left-1/2 z-50 -translate-x-1/2 w-[92%] max-w-lg animate-in fade-in slide-in-from-top-4 duration-300 drop-shadow-2xl"
        >
          <div className="overflow-hidden rounded-2xl border border-emerald-500/30 bg-slate-900/95 text-white backdrop-blur-md shadow-2xl">
            {/* Top Bar resembling phone notification */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-4 py-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-black">
                  <MessageSquare className="h-3 w-3 stroke-[2.5]" />
                </div>
                <span className="font-bold tracking-wide text-emerald-400">
                  {activeBanner.senderId || "VK-MANDI"}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-300 font-medium">MandiMitra Alerts</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Just now</span>
                <button
                  onClick={() => setActiveBanner(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                  aria-label="Dismiss SMS notification"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Notification Body */}
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-950/80 px-2 py-0.5 text-[11px] font-semibold text-emerald-300 border border-emerald-800/60">
                      <Phone className="h-2.5 w-2.5" />
                      +91-{activeBanner.to}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        activeBanner.status === "DELIVERED" || activeBanner.status === "SENT"
                          ? "bg-green-900/60 text-green-300"
                          : "bg-blue-900/60 text-blue-300"
                      }`}
                    >
                      {activeBanner.status} ({activeBanner.provider})
                    </span>
                  </div>

                  <p className="text-sm font-medium leading-relaxed text-slate-100">
                    {activeBanner.message}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-slate-800/80 pt-3">
                {extractOtp(activeBanner.message) && (
                  <button
                    onClick={() =>
                      handleCopyText(extractOtp(activeBanner.message)!, activeBanner.id)
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white transition active:scale-95 cursor-pointer shadow-sm"
                  >
                    {copiedId === activeBanner.id ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Copied OTP!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy OTP: {extractOtp(activeBanner.message)}</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsDrawerOpen(true);
                    setActiveBanner(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition cursor-pointer"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>View SMS Inbox ({allSmsLogs.length})</span>
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* ========================================================================= */}
      {/* 2. FLOATING SMS INBOX LAUNCHER (BOTTOM RIGHT / CORNER)                    */}
      {/* ========================================================================= */}
      <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
        <button
          onClick={() => setIsDrawerOpen((prev) => !prev)}
          className="group flex items-center gap-2.5 rounded-full border border-emerald-600/40 bg-slate-900/90 hover:bg-slate-900 px-4 py-2.5 text-white shadow-xl backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Open Mandi SMS Notification Center"
          aria-label="Open SMS inbox"
        >
          <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white shadow-inner">
            <MessageSquare className="h-3.5 w-3.5" />
            {allSmsLogs.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-black ring-2 ring-slate-900">
                {allSmsLogs.length > 9 ? "9+" : allSmsLogs.length}
              </span>
            )}
          </div>

          <div className="text-left hidden sm:block">
            <p className="text-xs font-bold leading-none text-slate-100">Farmer SMS</p>
            <p className="text-[10px] text-emerald-400 font-medium leading-tight mt-0.5">
              {gatewayInfo.isLive ? "Live Gateway" : "Demo Simulation"}
            </p>
          </div>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. SLIDE-OVER SMS INBOX & AUDIT DRAWER                                    */}
      {/* ========================================================================= */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-[#13491E] to-[#1B5E2B] px-5 py-4 text-white">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight">Farmer SMS Alerts</h3>
                  <p className="text-xs text-emerald-200">MandiMitra Notification Dispatcher</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="rounded-lg p-2 text-emerald-200 hover:bg-white/10 hover:text-white transition"
                  title={soundEnabled ? "Mute notification sound" : "Enable notification sound"}
                  aria-label="Toggle sound"
                >
                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="rounded-lg p-2 text-emerald-200 hover:bg-white/10 hover:text-white transition"
                  aria-label="Close drawer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Gateway Status Card */}
            <div className="border-b border-gray-200 bg-emerald-50/70 p-4 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      gatewayInfo.isLive ? "bg-green-500 animate-pulse" : "bg-blue-500"
                    }`}
                  />
                  <span className="font-bold text-gray-800">{gatewayInfo.name}</span>
                </div>
                <span className="rounded bg-white px-2 py-0.5 font-mono text-[10px] font-semibold text-gray-600 border border-gray-200">
                  {gatewayInfo.provider}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-gray-600">
                {gatewayInfo.isLive
                  ? "SMS will be dispatched to real mobile devices via third-party telecom carrier."
                  : "Running in local simulation mode. Messages appear here and in screen alerts without carrier fees."}
              </p>
            </div>

            {/* SMS Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {allSmsLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 mb-3">
                    <MessageSquare className="h-7 w-7" />
                  </div>
                  <p className="font-semibold text-gray-700 text-sm">No SMS messages yet</p>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs">
                    Try logging in on the Farmer Portal or booking a slot to see real-time SMS notifications.
                  </p>
                </div>
              ) : (
                allSmsLogs.map((log) => {
                  const otp = extractOtp(log.message);
                  return (
                    <div
                      key={log.id}
                      className="group rounded-xl border border-gray-200 bg-white p-3.5 shadow-xs transition hover:border-emerald-500 hover:shadow-md"
                    >
                      <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1.5">
                        <div className="flex items-center gap-1.5 font-semibold text-gray-800">
                          <Phone className="h-3 w-3 text-emerald-600" />
                          <span>+91-{log.to}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                              log.status === "DELIVERED" || log.status === "SENT"
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {log.status}
                          </span>
                          <span>
                            {new Date(log.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs font-medium text-gray-800 leading-relaxed">
                        {log.message}
                      </p>

                      <div className="mt-2.5 flex items-center justify-between border-t border-gray-100 pt-2 text-[11px]">
                        <span className="font-mono text-gray-400 text-[10px]">
                          Sender: {log.senderId}
                        </span>

                        {otp && (
                          <button
                            onClick={() => handleCopyText(otp, log.id)}
                            className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                          >
                            {copiedId === log.id ? (
                              <>
                                <Check className="h-3 w-3" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Copy Code ({otp})</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Test Send Section */}
            <div className="border-t border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-bold text-gray-800 mb-2">Send Test Alert</p>
              <form onSubmit={handleSendTestSms} className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="tel"
                      maxLength={10}
                      value={testMobile}
                      onChange={(e) => setTestMobile(e.target.value.replace(/\D/g, ""))}
                      placeholder="10-digit mobile number"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-900 placeholder:text-gray-400 outline-none focus:border-emerald-600"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={testSending || testMobile.length !== 10}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 px-3 py-2 text-xs font-bold text-white transition disabled:opacity-50 cursor-pointer"
                  >
                    {testSending ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                    <span>Test</span>
                  </button>
                </div>
                {testResult && (
                  <p
                    className={`text-[11px] font-medium ${
                      testResult.startsWith("Error") ? "text-red-600" : "text-emerald-700"
                    }`}
                  >
                    {testResult}
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
