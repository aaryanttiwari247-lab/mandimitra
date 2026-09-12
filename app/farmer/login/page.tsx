"use client";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Phone,
  RefreshCw,
  Sprout,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/context/language-context";
import { LanguageSelector } from "@/components/LanguageSelector";

import {
  saveFarmerSession,
  saveOtp,
  getOtp,
  FarmerUser,
} from "@/lib/farmer-auth";

export default function FarmerLogin() {
  const router = useRouter();
  const { t } = useLanguage();
  const [mobile, setMobile] = useState("");

  // OTP states
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(30);
  const [message, setMessage] = useState("");

  // Verification state
  const [verified, setVerified] = useState(false);
  const [farmerProfile, setFarmerProfile] = useState<FarmerUser | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Development OTP
  const [developmentOtp, setDevelopmentOtp] = useState("");

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
    if (mobile.length !== 10) {
      setMessage("Please enter a valid 10-digit mobile number.");
      return;
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
      setMessage("Incorrect OTP. Please try again.");
      return;
    }

    setVerifying(true);

    try {
      const res = await fetch("/api/farmers/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
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
        const saved = saveFarmerSession({ mobile });
        setFarmerProfile(saved);
        localStorage.removeItem("smartProcurementBooking");
      }
    } catch {
      const saved = saveFarmerSession({ mobile });
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

  // Go back to mobile number
  const handleBackToMobile = () => {
    setShowOtp(false);
    setOtp("");
    setDevelopmentOtp("");
    setMessage("");
    setTimer(30);
  };

  // ============================================================
  // VERIFIED SCREEN
  // ============================================================

  if (verified) {
    return (
      <main className="min-h-screen bg-[#F7F9F5]">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F5E9]">
                <Sprout className="h-6 w-6 text-[#2E7D32]" />
              </div>

              <div>
                <p className="font-bold text-[#176B2B]">{t("common.appName")}</p>
                <p className="text-xs text-gray-500">{t("auth.farmerPortal")}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <LanguageSelector />
              <button
                onClick={() => router.push("/")}
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

            <div className="mt-8 grid gap-4 sm:grid-cols-2 rounded-2xl bg-[#F7F9F5] p-6 text-left">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">{t("auth.registeredMobile")}</p>
                <p className="mt-1 text-base font-bold text-black">+91 {mobile}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">{t("auth.farmerId")}</p>
                <p className="mt-1 text-base font-bold text-[#2E7D32]">{farmerProfile?.farmerCode || farmerProfile?.farmerId || `FMR${mobile.slice(-4)}`}</p>
              </div>
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
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8F5E9]">
              <Sprout className="h-8 w-8 text-[#2E7D32]" />
            </div>

            <h1 className="mt-5 text-3xl font-bold text-[#1F2933]">
              {showOtp ? t("auth.otpVerification") : t("auth.farmerLogin")}
            </h1>

            <p className="mt-2 text-gray-600">
              {showOtp
                ? `${t("auth.enterOtpSentTo")} +91 ${mobile}`
                : t("auth.enterMobile")}
            </p>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            {!showOtp ? (
              <>
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

                {message && (
                  <p className="mt-3 text-sm font-medium text-red-600">
                    {message}
                  </p>
                )}

                <button
                  onClick={handleContinue}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2E7D32] px-5 py-4 text-base font-semibold text-white transition hover:bg-[#256428] active:scale-[0.99]"
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
                <label className="text-sm font-semibold text-black">
                  Enter OTP
                </label>

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
                  placeholder="Enter 6-digit OTP"
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
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2E7D32] px-5 py-4 text-base font-semibold text-white transition hover:bg-[#256428] active:scale-[0.99] disabled:opacity-60"
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
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[#2E7D32] hover:underline"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Resend OTP
                    </button>
                  )}
                </div>

                <div className="mt-6 border-t border-gray-100 pt-6 text-center">
                  <button
                    onClick={handleBackToMobile}
                    className="text-sm font-semibold text-gray-600 hover:text-[#2E7D32]"
                  >
                    ← {t("auth.changeMobile")}
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
