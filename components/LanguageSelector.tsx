"use client";

import React from "react";
import { Globe2 } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { Language } from "@/lib/translations";

type LanguageSelectorProps = {
  className?: string;
};

export function LanguageSelector({ className = "" }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();

  const languages: { code: Language; label: string }[] = [
    { code: "en", label: "English" },
    { code: "hi", label: "हिन्दी" },
    { code: "bn", label: "বাংলা" },
  ];

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 shadow-xs transition hover:border-[#2E7D32]">
        <Globe2 className="h-4 w-4 text-[#2E7D32] shrink-0" />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="cursor-pointer appearance-none bg-transparent pr-4 text-sm font-semibold text-gray-800 outline-none hover:text-[#2E7D32]"
          aria-label="Change Language"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code} className="text-black bg-white">
              {lang.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2.5 text-xs text-gray-500">▾</span>
      </div>
    </div>
  );
}
