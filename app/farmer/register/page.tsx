"use client";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Phone,
  Sprout,
  User,
  MapPin,
  Wheat,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/context/language-context";
import { LanguageSelector } from "@/components/LanguageSelector";
import { BrandLogo } from "@/components/BrandLogo";
import { registerFarmerProfile } from "@/lib/farmer-auth";

export default function FarmerRegister() {
  const router = useRouter();
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [village, setVillage] = useState("");
  const [district, setDistrict] = useState("Khargone");
  const [landAcres, setLandAcres] = useState("");
  const [primaryCrop, setPrimaryCrop] = useState("Cotton");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setMessage("Please enter your full name.");
      return;
    }

    if (mobile.length !== 10) {
      setMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!district.trim()) {
      setMessage("Please enter your district.");
      return;
    }

    const parsedAcres = landAcres ? parseFloat(landAcres) : undefined;
    if (landAcres && (parsedAcres === undefined || Number.isNaN(parsedAcres) || parsedAcres <= 0)) {
      setMessage("Please enter a valid land size in acres.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/farmers/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          mobile,
          village: village.trim() || undefined,
          district: district.trim(),
          landAcres: parsedAcres,
          primaryCrop,
        }),
      });

      const data = await res.json();

      registerFarmerProfile({
        name: data?.farmer?.name || name.trim(),
        mobile,
        village: data?.farmer?.village || village.trim() || undefined,
        district: data?.farmer?.district || district.trim(),
        landAcres: data?.farmer?.landAcres || parsedAcres,
        primaryCrop: data?.farmer?.primaryCrop || primaryCrop,
      });

      setIsSuccess(true);
    } catch {
      registerFarmerProfile({
        name: name.trim(),
        mobile,
        village: village.trim() || undefined,
        district: district.trim(),
        landAcres: parsedAcres,
        primaryCrop,
      });
      setIsSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <main className="min-h-screen bg-[#F7F9F5]">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
            <div className="flex items-center gap-3">
              <BrandLogo size="md" />
              <div>
                <p className="font-bold text-[#176B2B]">{t("common.appName")}</p>
                <p className="text-xs text-gray-500">{t("register.title")}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSelector />
              <Link
                href="/"
                className="text-sm font-medium text-gray-600 transition hover:text-[#2E7D32]"
              >
                {t("common.home")}
              </Link>
            </div>
          </div>
        </header>

        <section className="flex min-h-[calc(100vh-73px)] items-center justify-center px-5 py-10">
          <div className="w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#E8F5E9]">
              <CheckCircle2 className="h-10 w-10 text-[#2E7D32]" />
            </div>

            <h1 className="mt-6 text-3xl font-bold text-[#1F2933]">
              {t("register.completeTitle")}
            </h1>

            <p className="mt-3 text-gray-600">
              {t("auth.verifiedTitle")}, <span className="font-semibold text-black">{name}</span>. {t("register.completeDesc")}
            </p>

            <div className="mt-6 space-y-2 rounded-2xl bg-[#F7F9F5] p-5 text-left text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">{t("auth.farmerId")}</span>
                <span className="font-bold text-black">FMR{mobile.slice(-4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t("auth.registeredMobile")}</span>
                <span className="font-bold text-black">+91 {mobile}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t("register.primaryCrop")}</span>
                <span className="font-bold text-black">{primaryCrop}</span>
              </div>
              {district && (
                <div className="flex justify-between">
                  <span className="text-gray-500">{t("register.district")}</span>
                  <span className="font-bold text-black">{district}</span>
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

  return (
    <main className="min-h-screen bg-[#F7F9F5]">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link
            href="/farmer/login"
            className="flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-[#2E7D32]"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("register.backToLogin")}
          </Link>

<LanguageSelector />
        </div>
      </header>

      <section className="flex min-h-[calc(100vh-73px)] items-center justify-center px-5 py-10">
        <div className="w-full max-w-lg">
          <div className="mb-8 text-center">
            <div className="mx-auto flex justify-center">
              <BrandLogo size="lg" rounded="full" className="ring-4 ring-[#E8F5E9]" />
            </div>

            <h1 className="mt-5 text-3xl font-bold text-[#1F2933]">
              {t("register.title")}
            </h1>

            <p className="mt-2 text-gray-600">
              {t("register.subtitle")}
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
          >
            {/* Full Name */}
            <div className="mb-4">
              <label className="text-sm font-semibold text-black">
                {t("register.fullName")}
              </label>
              <div className="relative mt-2 flex items-center">
                <User className="absolute left-3.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setMessage("");
                  }}
                  placeholder={t("register.fullNamePlaceholder")}
                  className="w-full rounded-xl border border-gray-300 bg-white py-3.5 pl-11 pr-4 text-sm font-medium text-black placeholder:text-gray-400 outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/10"
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div className="mb-4">
              <label className="text-sm font-semibold text-black">
                {t("register.mobileNumber")}
              </label>
              <div className="mt-2 flex overflow-hidden rounded-xl border border-gray-300 bg-white focus-within:border-[#2E7D32] focus-within:ring-2 focus-within:ring-[#2E7D32]/10">
                <div className="flex items-center gap-2 border-r border-gray-200 bg-gray-50 px-4 text-sm text-gray-700">
                  🇮🇳
                  <span>+91</span>
                </div>
                <div className="relative flex flex-1 items-center">
                  <Phone className="absolute left-3 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    required
                    value={mobile}
                    onChange={(e) => {
                      setMobile(e.target.value.replace(/\D/g, ""));
                      setMessage("");
                    }}
                    placeholder="10-digit number"
                    className="w-full bg-transparent py-3.5 pl-11 pr-4 text-sm font-bold text-black placeholder:text-gray-400 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* District & Village */}
            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-black">
                  {t("register.district")}
                </label>
                <div className="relative mt-2 flex items-center">
                  <MapPin className="absolute left-3.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder={t("register.districtPlaceholder")}
                    className="w-full rounded-xl border border-gray-300 bg-white py-3.5 pl-10 pr-3 text-sm font-medium text-black outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-black">
                  {t("register.village")}
                </label>
                <input
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder={t("register.villagePlaceholder")}
                  className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-sm font-medium text-black outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/10"
                />
              </div>
            </div>

            {/* Primary Crop & Land Size */}
            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-black">
                  {t("register.primaryCrop")}
                </label>
                <div className="relative mt-2 flex items-center">
                  <Wheat className="absolute left-3.5 h-4 w-4 text-gray-400" />
                  <select
                    value={primaryCrop}
                    onChange={(e) => setPrimaryCrop(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white py-3.5 pl-10 pr-3 text-sm font-medium text-black outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/10"
                  >
                    <option value="Cotton">{t("crops.Cotton")}</option>
                    <option value="Wheat">{t("crops.Wheat")}</option>
                    <option value="Soybean">{t("crops.Soybean")}</option>
                    <option value="Mustard">{t("crops.Mustard")}</option>
                    <option value="Paddy">{t("crops.Paddy")}</option>
                    <option value="Gram">{t("crops.Gram")}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-black">
                  {t("register.landAcres")}
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={landAcres}
                  onChange={(e) => setLandAcres(e.target.value)}
                  placeholder={t("register.landAcresPlaceholder")}
                  className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-sm font-medium text-black outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/10"
                />
              </div>
            </div>

            {message && (
              <p className="mt-3 text-sm font-medium text-red-600">{message}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2E7D32] px-5 py-4 text-base font-semibold text-white transition hover:bg-[#256428] active:scale-[0.99] disabled:opacity-60"
            >
              {loading ? t("register.submitting") : t("register.submitBtn")}
              <ArrowRight className="h-5 w-5" />
            </button>

            <div className="mt-6 border-t border-gray-100 pt-6 text-center">
              <p className="text-sm text-gray-500">{t("register.alreadyRegistered")}</p>
              <Link
                href="/farmer/login"
                className="mt-2 inline-block text-sm font-semibold text-[#2E7D32] hover:underline"
              >
                ← {t("register.backToLogin")}
              </Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
