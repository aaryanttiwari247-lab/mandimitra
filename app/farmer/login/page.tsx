"use client";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Phone,
  RefreshCw,
  CreditCard,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/context/language-context";
import { LanguageSelector } from "@/components/LanguageSelector";
import { BrandLogo } from "@/components/BrandLogo";

import {
  saveFarmerSession,
  saveOtp,
  getOtp,
  clearFarmerSession,
  FarmerUser,
  findFarmerByAadhaar,
} from "@/lib/farmer-auth";

export default function FarmerLogin() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loginMethod, setLoginMethod] = useState<"mobile" | "aadhaar">("mobile");
  const [mobile, setMobile] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [autoFilledSuccess, setAutoFilledSuccess] = useState(false);

  // OTP states
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(30);
  const [message, setMessage] = useState("");

  // Clear any previous farmer session or booking upon arriving at login
  useEffect(() => {
    clearFarmerSession();
  }, []);

  // Verification state
  const [verified, setVerified] = useState(false);
  const [farmerProfile, setFarmerProfile] = useState<FarmerUser | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Development OTP
  const [developmentOtp, setDevelopmentOtp] = useState("");

  // Format Aadhaar: XXXX XXXX XXXX
  const formatAadhaar = (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 12);
    const parts = clean.match(/.{1,4}/g);
    return parts ? parts.join(" ") : clean;
  };

  // Auto-Fill OTP handler
  const handleAutoFillOtp = (targetOtp?: string) => {
    const code = targetOtp || developmentOtp;
    if (!code) return;
    setOtp(code);
    setMessage("");
    setAutoFilledSuccess(true);
    setTimeout(() => {
      setAutoFilledSuccess(false);
    }, 3000);
  };

  // Countdown
  useEffect(() => {
    if (!showOtp || timer <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setTimer((previous) => previous - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [showOtp, timer]);

  // Send OTP
  const handleContinue = () => {
    if (loginMethod === "mobile") {
      if (mobile.length !== 10) {
        setMessage(t("auth.invalidMobile") || "Please enter a valid 10-digit mobile number.");
        return;
      }
    } else {
      const cleanAadhaar = aadhaar.replace(/\D/g, "");
      if (cleanAadhaar.length !== 12) {
        setMessage(t("auth.invalidAadhaar") || "Please enter a valid 12-digit Aadhaar number.");
        return;
      }
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();

    saveOtp(newOtp);

    setDevelopmentOtp(newOtp);
    setOtp("");
    setMessage("");
    setTimer(30);
    setShowOtp(true);
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setMessage("Please enter the 6-digit OTP.");
      return;
    }

    const storedOtp = getOtp();

    if (!storedOtp || otp !== storedOtp) {
      setMessage(t("auth.invalidOtp") || "Incorrect OTP. Please try again.");
      return;
    }

    setVerifying(true);

    const cleanAadhaar = loginMethod === "aadhaar" ? aadhaar.replace(/\D/g, "") : undefined;

    try {
      const res = await fetch("/api/farmers/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: loginMethod === "mobile" ? mobile : undefined,
          aadhaar: cleanAadhaar,
        }),
      });
      const data = await res.json();

      if (data.success && data.farmer) {
        const saved = saveFarmerSession(data.farmer);
        setFarmerProfile(saved);
        if (data.latestBooking) {
          localStorage.setItem("smartProcurementBooking", JSON.stringify(data.latestBooking));
        } else {
          localStorage.removeItem("smartProcurementBooking");
        }
      } else {
        const fallbackFarmer = cleanAadhaar ? findFarmerByAadhaar(cleanAadhaar) : null;
        const resolvedMobile = fallbackFarmer?.mobile || (cleanAadhaar ? `98765${cleanAadhaar.slice(-5)}` : mobile);
        const saved = saveFarmerSession({
          mobile: resolvedMobile,
          aadhaar: cleanAadhaar,
          name: fallbackFarmer?.name || (cleanAadhaar ? `Farmer (UID *${cleanAadhaar.slice(-4)})` : undefined),
        });
        setFarmerProfile(saved);
        localStorage.removeItem("smartProcurementBooking");
      }
    } catch {
      const fallbackFarmer = cleanAadhaar ? findFarmerByAadhaar(cleanAadhaar) : null;
      const resolvedMobile = fallbackFarmer?.mobile || (cleanAadhaar ? `98765${cleanAadhaar.slice(-5)}` : mobile);
      const saved = saveFarmerSession({
        mobile: resolvedMobile,
        aadhaar: cleanAadhaar,
        name: fallbackFarmer?.name || (cleanAadhaar ? `Farmer (UID *${cleanAadhaar.slice(-4)})` : undefined),
      });
      setFarmerProfile(saved);
      localStorage.removeItem("smartProcurementBooking");
    } finally {
      setVerifying(false);
      setMessage("");
      setVerified(true);
    }
  };

  // {t("auth.resendOtp")}
  const handleResend = () => {
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();

    saveOtp(newOtp);

    setDevelopmentOtp(newOtp);
    setOtp("");
    setTimer(30);
    setMessage("");
  };

  // Go back to mobile / aadhaar number
  const handleBackToMobile = () => {
    setShowOtp(false);
    setOtp("");
    setDevelopmentOtp("");
    setMessage("");
    setTimer(30);
    setAutoFilledSuccess(false);
  };

  // ============================================================
  // VERIFIED SCREEN
  // ============================================================

  if (verified) {
    const cleanAadhaar = farmerProfile?.aadhaar || (loginMethod === "aadhaar" ? aadhaar.replace(/\D/g, "") : "");
    return (
      <main className="min-h-screen bg-[#F7F9F5]">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
            <div className="flex items-center gap-3">
              <BrandLogo size="md" />

              <div>
                <p className="font-bold text-[#176B2B]">{t("common.appName")}</p>
                <p className="text-xs text-gray-500">{t("auth.farmerPortal")}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <LanguageSelector />
              <button
                onClick={() => {
                  clearFarmerSession();
                  router.push("/");
                }}
                className="text-sm font-medium text-gray-600 transition hover:text-[#2E7D32]"
              >
                {t("common.logout")}
              </button>
            </div>
          </div>
        </header>

        <section className="flex min-h-[calc(100vh-73px)] items-center justify-center px-5 py-10">
          <div className="w-full max-w-2xl rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#E8F5E9]">
              <CheckCircle2 className="h-10 w-10 text-[#2E7D32]" />
            </div>

            <h1 className="mt-6 text-3xl font-bold text-[#1F2933]">
              {t("auth.verifiedTitle")}, {farmerProfile?.name || "Farmer"}!
            </h1>

            <p className="mt-3 text-gray-600">
              {t("auth.verifiedDesc")}
            </p>

            {cleanAadhaar && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-800">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>{t("auth.aadhaarVerifiedNotice")} (UIDAI Verified)</span>
              </div>
            )}

            <div className="mt-8 grid gap-4 sm:grid-cols-2 rounded-2xl bg-[#F7F9F5] p-6 text-left">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">{t("auth.registeredMobile")}</p>
                <p className="mt-1 text-base font-bold text-black">+91 {farmerProfile?.mobile || mobile || "—"}</p>
              </div>
              {cleanAadhaar ? (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">{t("auth.aadhaarNumber")}</p>
                  <p className="mt-1 text-base font-bold text-emerald-800">XXXX XXXX {cleanAadhaar.slice(-4)}</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">{t("auth.farmerId")}</p>
                  <p className="mt-1 text-base font-bold text-[#2E7D32]">{farmerProfile?.farmerCode || farmerProfile?.farmerId || `FMR${(mobile || "").slice(-4)}`}</p>
                </div>
              )}
              {cleanAadhaar && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">{t("auth.farmerId")}</p>
                  <p className="mt-1 text-base font-bold text-[#2E7D32]">{farmerProfile?.farmerCode || farmerProfile?.farmerId || `FMR${cleanAadhaar.slice(-4)}`}</p>
                </div>
              )}
              {farmerProfile?.district && (
                <div className="sm:col-span-2 pt-2 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase">{t("auth.locationAndLand")}</p>
                  <p className="mt-1 text-sm font-medium text-gray-800">
                    📍 {farmerProfile.village ? `${farmerProfile.village}, ` : ""}${farmerProfile.district} • {farmerProfile.landAcres || 0} Acres ({farmerProfile.primaryCrop || "Cotton"})
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => router.push("/farmer/dashboard")}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2E7D32] px-5 py-4 text-base font-semibold text-white transition hover:bg-[#256428] active:scale-[0.99]"
            >
              {t("auth.goToDashboard")}
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </section>
      </main>
    );
  }

  // ============================================================
  // LOGIN / OTP SCREEN
  // ============================================================

  return (
    <main className="min-h-screen bg-[#F7F9F5]">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <button
            onClick={() => {
              if (showOtp) {
                handleBackToMobile();
              } else {
                router.push("/");
              }
            }}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-[#2E7D32]"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("common.back")}
          </button>

<LanguageSelector />
        </div>
      </header>

      <section className="flex min-h-[calc(100vh-73px)] items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto flex justify-center">
              <BrandLogo size="lg" rounded="full" className="ring-4 ring-[#E8F5E9]" />
            </div>

            <h1 className="mt-5 text-3xl font-bold text-[#1F2933]">
              {showOtp ? t("auth.otpVerification") : t("auth.farmerLogin")}
            </h1>

            <p className="mt-2 text-gray-600">
              {showOtp
                ? loginMethod === "aadhaar"
                  ? `${t("auth.enterOtpSentTo")} Aadhaar (XXXX XXXX ${aadhaar.replace(/\D/g, "").slice(-4)})`
                  : `${t("auth.enterOtpSentTo")} +91 ${mobile}`
                : loginMethod === "aadhaar"
                  ? t("auth.enterAadhaar")
                  : t("auth.enterMobile")}
            </p>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            {!showOtp ? (
              <>
                {/* Method Switcher Tabs */}
                <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl bg-gray-100 p-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod("mobile");
                      setMessage("");
                    }}
                    className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition cursor-pointer ${
                      loginMethod === "mobile"
                        ? "bg-white text-[#2E7D32] shadow-sm font-bold"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Phone className="h-4 w-4" />
                    {t("auth.loginWithMobile")}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod("aadhaar");
                      setMessage("");
                    }}
                    className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition cursor-pointer ${
                      loginMethod === "aadhaar"
                        ? "bg-white text-[#2E7D32] shadow-sm font-bold"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <CreditCard className="h-4 w-4" />
                    {t("auth.loginWithAadhaar")}
                  </button>
                </div>

                {loginMethod === "mobile" ? (
                  <div>
                    <label className="text-sm font-semibold text-black">
                      {t("auth.mobileNumber")}
                    </label>

                    <div className="mt-2 flex overflow-hidden rounded-xl border border-gray-300 bg-white focus-within:border-[#2E7D32] focus-within:ring-2 focus-within:ring-[#2E7D32]/10">
                      <div className="flex items-center gap-2 border-r border-gray-200 bg-gray-50 px-4 text-sm text-gray-700">
                        🇮🇳
                        <span>+91</span>
                      </div>

                      <div className="relative flex flex-1 items-center">
                        <Phone className="absolute left-3 h-5 w-5 text-gray-500" />

                        <input
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          value={mobile}
                          onChange={(e) => {
                            setMobile(e.target.value.replace(/\D/g, ""));
                            setMessage("");
                          }}
                          placeholder={t("auth.mobilePlaceholder")}
                          className="w-full bg-transparent py-4 pl-11 pr-4 text-base font-bold text-black placeholder:text-gray-400 outline-none"
                        />
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-gray-500">
                      We will send an OTP to verify your mobile number.
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="text-sm font-semibold text-black">
                      {t("auth.aadhaarNumber")}
                    </label>

                    <div className="mt-2 flex overflow-hidden rounded-xl border border-gray-300 bg-white focus-within:border-[#2E7D32] focus-within:ring-2 focus-within:ring-[#2E7D32]/10">
                      <div className="flex items-center gap-1.5 border-r border-gray-200 bg-gray-50 px-3 text-xs font-semibold text-emerald-800">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        <span>UIDAI</span>
                      </div>

                      <div className="relative flex flex-1 items-center">
                        <CreditCard className="absolute left-3 h-5 w-5 text-gray-500" />

                        <input
                          type="tel"
                          inputMode="numeric"
                          maxLength={14}
                          value={aadhaar}
                          onChange={(e) => {
                            setAadhaar(formatAadhaar(e.target.value));
                            setMessage("");
                          }}
                          placeholder={t("auth.aadhaarPlaceholder")}
                          className="w-full bg-transparent py-4 pl-11 pr-4 text-base font-bold tracking-wider text-black placeholder:text-gray-400 placeholder:tracking-normal outline-none"
                        />
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-gray-500">
                      {t("auth.enterAadhaar")}
                    </p>
                  </div>
                )}

                {message && (
                  <p className="mt-3 text-sm font-medium text-red-600">
                    {message}
                  </p>
                )}

                <button
                  onClick={handleContinue}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2E7D32] px-5 py-4 text-base font-semibold text-white transition hover:bg-[#256428] active:scale-[0.99] cursor-pointer"
                >
                  {t("auth.continue")}
                  <ArrowRight className="h-5 w-5" />
                </button>

                <div className="mt-6 border-t border-gray-100 pt-6 text-center">
                  <p className="text-sm text-gray-500">
                    {t("auth.notRegistered")}
                  </p>

                  <Link
                    href="/farmer/register"
                    className="mt-2 inline-block text-sm font-semibold text-[#2E7D32] hover:underline"
                  >
                    {t("auth.registerBtn")} →
                  </Link>
                </div>
              </>
            ) : (
              <>
                {/* OTP Auto-fill Simulator Banner */}
                <div className="mb-4 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 p-3.5 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-emerald-950">
                          {t("auth.autoFillNotice")}
                        </p>
                        <p className="text-xs text-emerald-700">
                          OTP: <span className="font-mono font-bold text-sm text-emerald-900 tracking-wider">{developmentOtp}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAutoFillOtp()}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#2E7D32] hover:bg-[#256428] px-3.5 py-2 text-xs font-bold text-white shadow transition active:scale-95 cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {t("auth.autoFillOtp")}
                    </button>
                  </div>

                  {autoFilledSuccess && (
                    <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-emerald-100/90 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{t("auth.otpAutoFilled")}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-black">
                    {t("auth.enterOtp")}
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAutoFillOtp()}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#2E7D32] hover:underline cursor-pointer"
                  >
                    ⚡ {t("auth.autoFillOtp")}
                  </button>
                </div>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ""));
                    setMessage("");
                  }}
                  placeholder="• • • • • •"
                  className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] text-black placeholder:text-gray-400 outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/10"
                />

                <p className="mt-3 text-center text-xs text-gray-600">
                  {t("auth.devOtpNotice")}{" "}
                  <span className="font-bold text-[#2E7D32]">
                    {developmentOtp}
                  </span>
                </p>

                {message && (
                  <p className="mt-3 text-center text-sm font-medium text-red-600">
                    {message}
                  </p>
                )}

                <button
                  onClick={handleVerifyOtp}
                  disabled={verifying}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2E7D32] px-5 py-4 text-base font-semibold text-white transition hover:bg-[#256428] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                >
                  {verifying ? t("auth.verifying") : t("auth.verifyOtp")}
                  <CheckCircle2 className="h-5 w-5" />
                </button>

                <div className="mt-6 text-center">
                  {timer > 0 ? (
                    <p className="text-sm text-gray-500">
                      {t("auth.resendIn")}{" "}
                      <span className="font-semibold text-[#2E7D32]">
                        {timer}s
                      </span>
                    </p>
                  ) : (
                    <button
                      onClick={handleResend}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[#2E7D32] hover:underline cursor-pointer"
                    >
                      <RefreshCw className="h-4 w-4" />
                      {t("auth.resendOtp")}
                    </button>
                  )}
                </div>

                <div className="mt-6 border-t border-gray-100 pt-6 text-center">
                  <button
                    onClick={handleBackToMobile}
                    className="text-sm font-semibold text-gray-600 hover:text-[#2E7D32] cursor-pointer"
                  >
                    ← {loginMethod === "aadhaar" ? `${t("auth.changeIdentifier")} (Aadhaar)` : t("auth.changeMobile")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
