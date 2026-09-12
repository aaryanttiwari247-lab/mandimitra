"use client";

import {
  Building2,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  Sprout,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/context/language-context";

import { loginOfficial } from "@/lib/official-auth";

export default function OfficialLoginPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [officialId, setOfficialId] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");

    // ========================================================
    // VALIDATION
    // ========================================================

    if (!officialId.trim()) {
      setError("Please enter your official ID.");
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    // ========================================================
    // LOGIN
    // ========================================================

    setIsLoggingIn(true);

    const official = loginOfficial(
      officialId,
      password
    );

    // ========================================================
    // LOGIN FAILED
    // ========================================================

    if (!official) {
      setIsLoggingIn(false);

      setError(
        "Invalid official ID or password. Please check your credentials."
      );

      return;
    }

    // ========================================================
    // LOGIN SUCCESS
    // ========================================================

    setError("");

    /*
     * loginOfficial() has already saved the official
     * session in localStorage.
     *
     * Now send the official directly to the dashboard.
     */

    router.push("/official/dashboard");
  };

  return (
    <main className="min-h-screen bg-[#F7F9F5]">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="border-b border-gray-200 bg-white">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">

          {/* BRAND */}

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F5E9]">

              <Sprout className="h-6 w-6 text-[#2E7D32]" />

            </div>

            <div>

              <p className="text-lg font-bold text-[#2E7D32]">
                {t("common.appName")}
              </p>

              <p className="text-xs text-gray-500">
                {t("official.portalTitle")}
              </p>

            </div>

          </div>


          {/* RIGHT CONTROLS */}

          <div className="flex items-center gap-4">

            <LanguageSelector />

            <div className="hidden items-center gap-2 text-sm text-gray-500 sm:flex">

              <ShieldCheck className="h-4 w-4 text-[#2E7D32]" />

              {t("official.secureAccess")}

            </div>

          </div>

        </div>

      </header>


      {/* =====================================================
          LOGIN SECTION
      ===================================================== */}

      <section className="flex min-h-[calc(100vh-73px)] items-center justify-center px-5 py-10 sm:px-8">

        <div className="w-full max-w-md">


          {/* TITLE */}

          <div className="mb-8 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8F5E9]">

              <Building2 className="h-8 w-8 text-[#2E7D32]" />

            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-gray-900">
              {t("official.loginTitle")}
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              {t("official.loginSubtitle")}
            </p>

          </div>


          {/* LOGIN CARD */}

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">

            <form
              onSubmit={handleLogin}
              className="space-y-5"
            >


              {/* OFFICIAL ID */}

              <div>

                <label
                  htmlFor="officialId"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  {t("official.officialId")}
                </label>

                <div className="relative">

                  <UserRound className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                  <input
                    id="officialId"
                    type="text"
                    value={officialId}
                    onChange={(e) =>
                      setOfficialId(e.target.value)
                    }
                    placeholder={t("official.enterOfficialId")}
                    autoComplete="username"
                    className="w-full rounded-xl border border-gray-300 bg-white py-3.5 pl-12 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/10"
                  />

                </div>

              </div>


              {/* PASSWORD */}

              <div>

                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  {t("official.password")}
                </label>

                <div className="relative">

                  <LockKeyhole className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder={t("official.enterPassword")}
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-gray-300 bg-white py-3.5 pl-12 pr-12 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/10"
                  />


                  {/* SHOW PASSWORD */}

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-lg p-2 text-gray-400 transition hover:text-gray-700"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >

                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}

                  </button>

                </div>

              </div>


              {/* REMEMBER ME */}

              <div className="flex items-center justify-between">

                <label className="flex cursor-pointer items-center gap-2">

                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) =>
                      setRememberMe(e.target.checked)
                    }
                    className="h-4 w-4 rounded border-gray-300 accent-[#2E7D32]"
                  />

                  <span className="text-sm text-gray-600">
                    {t("official.rememberMe")}
                  </span>

                </label>


                <button
                  type="button"
                  onClick={() =>
                    alert(
                      "Please contact your system administrator to reset your password."
                    )
                  }
                  className="text-sm font-medium text-[#2E7D32] hover:underline"
                >
                  {t("official.forgotPassword")}
                </button>

              </div>


              {/* ERROR */}

              {error && (

                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">

                  <p className="text-sm leading-5 text-red-700">
                    {error}
                  </p>

                </div>

              )}


              {/* LOGIN BUTTON */}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2E7D32] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#256428] disabled:cursor-not-allowed disabled:opacity-70"
              >

                <ShieldCheck className="h-5 w-5" />

                {isLoggingIn
                  ? t("official.signingIn")
                  : t("official.signIn")}

              </button>

            </form>


            {/* =================================================
                DEMO CREDENTIALS
            ================================================= */}

            <div className="mt-6 rounded-xl border border-[#CDE8D0] bg-[#F1F8F2] p-4">

              <p className="text-xs font-bold uppercase tracking-wide text-[#2E7D32]">
                {t("official.devLoginTitle")}
              </p>

              <div className="mt-2 space-y-1 text-sm text-gray-700">

                <p>
                  <span className="font-semibold">
                    {t("official.officialId")}:
                  </span>{" "}
                  OFF001
                </p>

                <p>
                  <span className="font-semibold">
                    {t("official.password")}:
                  </span>{" "}
                  admin123
                </p>

              </div>

              <p className="mt-2 text-xs leading-5 text-gray-500">
                {t("official.devLoginNotice")}
              </p>

            </div>


            {/* SECURITY NOTE */}

            <div className="mt-6 border-t border-gray-100 pt-5">

              <div className="flex gap-3">

                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#2E7D32]" />

                <p className="text-xs leading-5 text-gray-500">

                  {t("official.securityNotice")}

                </p>

              </div>

            </div>

          </div>


          {/* FOOTER */}

          <p className="mt-6 text-center text-xs text-gray-500">

            {t("official.officialFooter")}

          </p>

        </div>

      </section>

    </main>
  );
}