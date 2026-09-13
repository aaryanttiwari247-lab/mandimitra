"use client";

import {
  ArrowRight,
  Building2,
  Clock,
  Receipt,
  ShieldCheck,
  Sparkles,
  Sprout,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/language-context";
import { LanguageSelector } from "@/components/LanguageSelector";
import { BrandLogo } from "@/components/BrandLogo";

export default function Home() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen lg:h-screen lg:max-h-screen flex flex-col justify-between bg-gradient-to-b from-[#F2F7F2] via-[#F8FAF7] to-[#EDF5EE] text-[#182230] overflow-y-auto lg:overflow-hidden">
      {/* LIGHT COLOR HEADER SUITED TO THE SITE */}
      <header className="border-b border-emerald-100/90 bg-gradient-to-r from-[#F3F9F3]/95 via-white/95 to-[#EFF7F0]/95 backdrop-blur-md sticky top-0 z-30 shadow-2xs shrink-0">
        <div className="mx-auto flex h-14 sm:h-16 max-w-[1320px] items-center justify-between px-4 sm:px-6">
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center gap-3 group cursor-pointer">
            <BrandLogo size="md" className="transition-transform group-hover:scale-105" />

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-[19px] font-extrabold leading-tight text-[#176B2B]">
                  {t("common.appName")}
                </h1>
                <span className="hidden md:inline-flex items-center rounded-full bg-emerald-100/80 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                  e-Procurement
                </span>
              </div>
              <p className="text-[11px] font-semibold text-[#64748B]">
                {t("common.tagline")} • MSP Portal
              </p>
            </div>
          </Link>

          {/* Right Header: Portal Quick Badges & Language Selector */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/farmer/login"
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/90 px-3 py-1 text-xs font-bold text-[#237A31] hover:bg-emerald-100 transition shadow-2xs"
              >
                <Users className="h-3.5 w-3.5" />
                <span>{t("home.farmerCardTitle")}</span>
              </Link>
              <Link
                href="/official/login"
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50/90 px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{t("home.officialCardTitle")}</span>
              </Link>
            </div>

            <div className="hidden sm:block h-6 w-px bg-emerald-200/60" />

            <LanguageSelector />
          </div>
        </div>
      </header>

      {/* MAIN ONE-PAGE CONTENT CONTAINER */}
      <section className="flex-1 flex flex-col justify-evenly max-w-[1240px] w-full mx-auto px-4 sm:px-6 py-2 sm:py-3 lg:py-3.5 min-h-0 text-center">
        {/* HERO INTRO */}
        <div className="shrink-0">
          {/* Badge */}
          <div className="mx-auto mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-100/90 px-3.5 py-1 text-[#1D6C2A] border border-emerald-200 text-xs font-semibold shadow-2xs">
            <Sprout className="h-3.5 w-3.5 text-[#2E7D32]" />
            <span>{t("home.badge")}</span>
          </div>

          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-extrabold leading-tight tracking-tight text-gray-900">
            {t("home.heroTitle1")}{" "}
            <span className="text-[#2E7D32] underline decoration-emerald-300 decoration-wavy underline-offset-4">
              {t("home.heroTitle2")}
            </span>
          </h2>

          {/* Description */}
          <p className="mx-auto mt-1.5 max-w-[720px] text-xs sm:text-sm lg:text-[15px] leading-relaxed text-[#475569]">
            {t("home.heroDesc")}
          </p>
        </div>

        {/* 2 MAIN PORTAL OPTIONS (Farmer Portal & Admin Portal) */}
        <div className="my-2.5 sm:my-3 lg:my-3.5 grid gap-3.5 sm:gap-5 text-left sm:grid-cols-2 shrink-0">
          {/* FARMER PORTAL CARD */}
          <Link
            href="/farmer/login"
            className="group rounded-2xl border-2 border-[#A2D8A8] bg-gradient-to-br from-white via-white to-emerald-50/40 p-4 sm:p-5 lg:p-6 shadow-xs transition-all hover:-translate-y-0.5 hover:border-[#2E7D32] hover:shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 sm:h-13 sm:w-13 items-center justify-center rounded-2xl bg-emerald-100/90 text-[#237A31] transition-transform group-hover:scale-105 shadow-2xs">
                  <Users className="h-6 w-6 sm:h-7 sm:w-7 text-[#2E7D32]" />
                </div>

                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-block rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                    Smart Token
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 group-hover:bg-emerald-600 transition">
                    <ArrowRight className="h-4 w-4 text-[#2E7D32] group-hover:text-white transition group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>

              <h3 className="mt-3 sm:mt-4 text-xl sm:text-2xl font-bold text-[#172033] group-hover:text-[#176B2B] transition">
                {t("home.farmerCardTitle")}
              </h3>

              <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-[#54657A]">
                {t("home.farmerCardDesc")}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-emerald-100 pt-3">
              <span className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#18802C] group-hover:underline">
                {t("home.farmerCardBtn")}
                <ArrowRight className="h-4 w-4" />
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                1-Click Slot Booking
              </span>
            </div>
          </Link>

          {/* ADMIN PORTAL CARD */}
          <Link
            href="/official/login"
            className="group rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-white via-white to-slate-50/50 p-4 sm:p-5 lg:p-6 shadow-xs transition-all hover:-translate-y-0.5 hover:border-slate-500 hover:shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 sm:h-13 sm:w-13 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition-transform group-hover:scale-105 shadow-2xs">
                  <Building2 className="h-6 w-6 sm:h-7 sm:w-7 text-[#334155]" />
                </div>

                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700 border border-slate-200">
                    APMC Official
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 group-hover:bg-slate-800 transition">
                    <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-white transition group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>

              <h3 className="mt-3 sm:mt-4 text-xl sm:text-2xl font-bold text-[#172033] group-hover:text-slate-900 transition">
                {t("home.officialCardTitle")}
              </h3>

              <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-[#54657A]">
                {t("home.officialCardDesc")}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#172033] group-hover:underline">
                {t("home.officialCardBtn")}
                <ArrowRight className="h-4 w-4" />
              </span>
              <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                Weighbridge & Queue
              </span>
            </div>
          </Link>
        </div>

        {/* 3 VALUE PILLARS (Crisp & compact) */}
        <div className="grid gap-2.5 sm:gap-4 text-left sm:grid-cols-3 shrink-0">
          <div className="rounded-xl border border-emerald-100/90 bg-white/90 p-3 sm:p-3.5 shadow-2xs flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-gray-900 leading-snug">
                {t("home.feature1Title")}
              </h4>
              <p className="mt-0.5 text-[11px] sm:text-xs text-gray-500 leading-relaxed line-clamp-2">
                {t("home.feature1Desc")}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-100/90 bg-white/90 p-3 sm:p-3.5 shadow-2xs flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-700 shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-gray-900 leading-snug">
                {t("home.feature2Title")}
              </h4>
              <p className="mt-0.5 text-[11px] sm:text-xs text-gray-500 leading-relaxed line-clamp-2">
                {t("home.feature2Desc")}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-100/90 bg-white/90 p-3 sm:p-3.5 shadow-2xs flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700 shrink-0">
              <Receipt className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-gray-900 leading-snug">
                {t("home.feature3Title")}
              </h4>
              <p className="mt-0.5 text-[11px] sm:text-xs text-gray-500 leading-relaxed line-clamp-2">
                {t("home.feature3Desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* COMPACT CLEAN FOOTER MICRO-BAR */}
      <footer className="py-2 text-center text-[11px] font-medium text-gray-500 border-t border-emerald-100/70 bg-white/60 shrink-0">
        <span>{t("common.appName")} • {t("common.tagline")} • Intelligent Agricultural Procurement System</span>
      </footer>
    </main>
  );
}