"use client";

import {
  ArrowRight,
  Building2,
  Sprout,
  Users,
  Sparkles,
  Clock,
  Receipt,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/language-context";
import { LanguageSelector } from "@/components/LanguageSelector";

export default function Home() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-[#f7faf7] text-[#182230]">
      {/* HEADER */}
      <header className="border-b border-[#e4e9e4] bg-white sticky top-0 z-30 shadow-2xs">
        <div className="mx-auto flex h-[70px] max-w-[1320px] items-center justify-between px-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e8f5e9]">
              <Sprout className="h-6 w-6 text-[#2e7d32]" />
            </div>

            <div>
              <h1 className="text-[19px] font-bold leading-tight text-[#176b2b]">
                {t("common.appName")}
              </h1>
              <p className="text-xs font-semibold text-[#64748b]">
                {t("common.tagline")}
              </p>
            </div>
          </div>

          {/* Language Selector */}
          <LanguageSelector />
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto max-w-[1050px] px-6 pb-20 pt-14 text-center">
        {/* Badge */}
        <div className="mx-auto mb-8 flex w-fit items-center gap-2 rounded-full bg-[#e7f5e9] px-5 py-2.5 text-[#237a31] border border-[#c8e6c9]">
          <Sprout className="h-4 w-4" />
          <span className="text-sm font-semibold">
            {t("home.badge")}
          </span>
        </div>

        {/* Heading */}
        <h2 className="text-4xl font-extrabold leading-[1.2] tracking-tight text-gray-900 sm:text-6xl">
          {t("home.heroTitle1")}
          <br />
          <span className="text-[#2e7d32]">
            {t("home.heroTitle2")}
          </span>
        </h2>

        {/* Description */}
        <p className="mx-auto mt-6 max-w-[760px] text-base sm:text-lg leading-8 text-[#36516d]">
          {t("home.heroDesc")}
        </p>

        {/* OPTIONS */}
        <div className="mt-12 grid gap-6 text-left sm:grid-cols-2">
          {/* FARMER CARD */}
          <Link
            href="/farmer/login"
            className="group rounded-3xl border border-[#b9dfbd] bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-[#2e7d32] hover:shadow-xl"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e6f4e8] transition-transform group-hover:scale-105">
                <Users className="h-8 w-8 text-[#2e7d32]" />
              </div>

              <ArrowRight className="h-6 w-6 text-[#94a3b8] transition-transform group-hover:translate-x-1.5 group-hover:text-[#2e7d32]" />
            </div>

            <h3 className="mt-8 text-2xl font-bold text-[#172033]">
              {t("home.farmerCardTitle")}
            </h3>

            <p className="mt-3 text-base leading-7 text-[#64748b]">
              {t("home.farmerCardDesc")}
            </p>

            <div className="mt-7 flex items-center gap-2 font-semibold text-[#18802c]">
              {t("home.farmerCardBtn")}
              <ArrowRight className="h-5 w-5" />
            </div>
          </Link>

          {/* OFFICIAL CARD */}
          <Link
            href="/official/login"
            className="group rounded-3xl border border-[#e0e4e8] bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-gray-400 hover:shadow-xl"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f1f3f5] transition-transform group-hover:scale-105">
                <Building2 className="h-8 w-8 text-[#334155]" />
              </div>

              <ArrowRight className="h-6 w-6 text-[#94a3b8] transition-transform group-hover:translate-x-1.5 group-hover:text-gray-900" />
            </div>

            <h3 className="mt-8 text-2xl font-bold text-[#172033]">
              {t("home.officialCardTitle")}
            </h3>

            <p className="mt-3 text-base leading-7 text-[#64748b]">
              {t("home.officialCardDesc")}
            </p>

            <div className="mt-7 flex items-center gap-2 font-semibold text-[#172033]">
              {t("home.officialCardBtn")}
              <ArrowRight className="h-5 w-5" />
            </div>
          </Link>
        </div>

        {/* 3 VALUE PILLARS */}
        <div className="mt-12 grid gap-6 text-left sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 mb-4">
              <Sparkles className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-gray-900">{t("home.feature1Title")}</h4>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">{t("home.feature1Desc")}</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-700 mb-4">
              <Clock className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-gray-900">{t("home.feature2Title")}</h4>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">{t("home.feature2Desc")}</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 mb-4">
              <Receipt className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-gray-900">{t("home.feature3Title")}</h4>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">{t("home.feature3Desc")}</p>
          </div>
        </div>
      </section>
    </main>
  );
}