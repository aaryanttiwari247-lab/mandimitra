"use client";

import React, { useState, useRef, useEffect } from "react";
import { Globe2, Check, ChevronDown } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { Language } from "@/lib/translations";

type LanguageSelectorProps = {
  className?: string;
  align?: "left" | "right";
};

export function LanguageSelector({
  className = "",
  align = "right",
}: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const languages: {
    code: Language;
    label: string;
    englishName: string;
    badge: string;
  }[] = [
    { code: "en", label: "English", englishName: "English (Default)", badge: "EN" },
    { code: "hi", label: "हिन्दी", englishName: "Hindi", badge: "HI" },
    { code: "bn", label: "বাংলা", englishName: "Bengali", badge: "BN" },
  ];

  const currentLang =
    languages.find((l) => l.code === language) || languages[0];

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (code: Language) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left select-none ${className}`}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Change Language"
        className="group flex items-center gap-2 rounded-xl border border-gray-200 bg-white/95 px-3 py-1.5 text-xs sm:text-sm font-semibold text-gray-800 shadow-xs transition-all duration-200 hover:border-[#2E7D32]/60 hover:bg-emerald-50/40 hover:shadow-sm focus:outline-hidden focus:ring-2 focus:ring-[#2E7D32]/20 active:scale-[0.98]"
      >
        <Globe2 className="h-4 w-4 text-[#2E7D32] transition-transform duration-300 group-hover:rotate-12 shrink-0" />
        
        <span className="rounded-md bg-[#2E7D32]/10 px-1.5 py-0.5 text-[10px] font-extrabold text-[#176B2B] tracking-wide">
          {currentLang.badge}
        </span>

        <span className="font-medium text-gray-800">
          {currentLang.label}
        </span>

        <ChevronDown
          className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 group-hover:text-[#2E7D32] ${
            isOpen ? "rotate-180 text-[#2E7D32]" : ""
          }`}
        />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className={`absolute ${
            align === "left" ? "left-0" : "right-0"
          } mt-2 w-52 origin-top-right rounded-2xl border border-emerald-100/90 bg-white/95 backdrop-blur-md p-1.5 shadow-xl ring-1 ring-black/5 z-50`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
            <span>Language / भाषा</span>
            <span className="text-[9px] font-semibold text-[#2E7D32]">
              MandiMitra
            </span>
          </div>

          {/* Options */}
          <div className="mt-1 space-y-0.5">
            {languages.map((lang) => {
              const isSelected = lang.code === language;
              return (
                <button
                  key={lang.code}
                  type="button"
                  role="menuitem"
                  onClick={() => handleSelect(lang.code)}
                  className={`group flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs sm:text-sm transition-all duration-150 ${
                    isSelected
                      ? "bg-[#2E7D32]/10 font-bold text-[#176B2B] ring-1 ring-[#2E7D32]/20"
                      : "text-gray-700 hover:bg-gray-100/80 hover:text-[#2E7D32]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-bold transition-colors ${
                        isSelected
                          ? "bg-[#2E7D32] text-white shadow-xs"
                          : "bg-gray-100 text-gray-600 group-hover:bg-emerald-100 group-hover:text-[#2E7D32]"
                      }`}
                    >
                      {lang.badge}
                    </span>
                    <div>
                      <p className="font-semibold leading-tight text-inherit">
                        {lang.label}
                      </p>
                      <p className="text-[10px] font-normal text-gray-400">
                        {lang.englishName}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="h-4 w-4 text-[#2E7D32] shrink-0 stroke-[2.5]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
