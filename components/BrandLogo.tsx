import Image from "next/image";

interface BrandLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  rounded?: "default" | "full";
}

export function BrandLogo({
  size = "md",
  className = "",
  rounded = "default",
}: BrandLogoProps) {
  const sizeConfig = {
    xs: { box: rounded === "full" ? "h-6 w-6 rounded-full" : "h-6 w-6 rounded-md", px: 24 },
    sm: { box: rounded === "full" ? "h-8 w-8 rounded-full" : "h-8 w-8 rounded-lg", px: 32 },
    md: { box: rounded === "full" ? "h-11 w-11 rounded-full" : "h-11 w-11 rounded-xl", px: 44 },
    lg: { box: rounded === "full" ? "h-16 w-16 rounded-full" : "h-16 w-16 rounded-2xl", px: 64 },
    xl: { box: rounded === "full" ? "h-20 w-20 rounded-full" : "h-20 w-20 rounded-3xl", px: 80 },
  }[size];

  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-black shadow-xs ring-1 ring-black/10 ${sizeConfig.box} ${className}`}
    >
      <Image
        src="/logo.png"
        alt="MandiMitra Logo"
        width={sizeConfig.px}
        height={sizeConfig.px}
        priority={size === "md" || size === "lg"}
        className="h-full w-full object-cover"
      />
    </div>
  );
}
