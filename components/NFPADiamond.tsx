/**
 * NFPA 704 Safety Diamond
 * Adapted from chemcheck-ai for Hazalyze Platform
 */

"use client";

interface NFPADiamondProps {
  health: string | number;
  flammability: string | number;
  reactivity: string | number;
  special?: string;
  size?: "sm" | "md" | "lg";
}

export default function NFPADiamond({
  health,
  flammability,
  reactivity,
  special = "",
  size = "md",
}: NFPADiamondProps) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  return (
    <div className={`relative ${sizeClasses[size]} mx-auto`}>
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
        {/* Health (Blue) - Top Diamond */}
        <polygon
          points="50,5 90,50 50,50"
          fill="#0066CC"
          stroke="#000"
          strokeWidth="2"
        />

        {/* Flammability (Red) - Left Diamond */}
        <polygon
          points="10,50 50,10 50,50"
          fill="#CC0000"
          stroke="#000"
          strokeWidth="2"
        />

        {/* Reactivity (Yellow) - Right Diamond */}
        <polygon
          points="90,50 50,90 50,50"
          fill="#FFCC00"
          stroke="#000"
          strokeWidth="2"
        />

        {/* Special (White) - Bottom Diamond */}
        <polygon
          points="50,50 50,90 10,50"
          fill="#FFFFFF"
          stroke="#000"
          strokeWidth="2"
        />

        {/* Text - Health (Blue - Top) */}
        <text
          x="70"
          y="33"
          textAnchor="middle"
          dominantBaseline="central"
          className="font-black fill-white"
          style={{
            fontFamily: "Arial Black, Arial, sans-serif",
            fontSize: "24px",
            fontWeight: "900",
          }}
        >
          {health}
        </text>

        {/* Text - Flammability (Red - Left) */}
        <text
          x="30"
          y="33"
          textAnchor="middle"
          dominantBaseline="central"
          className="font-black fill-white"
          style={{
            fontFamily: "Arial Black, Arial, sans-serif",
            fontSize: "24px",
            fontWeight: "900",
          }}
        >
          {flammability}
        </text>

        {/* Text - Reactivity (Yellow - Right) */}
        <text
          x="70"
          y="67"
          textAnchor="middle"
          dominantBaseline="central"
          className="font-black fill-black"
          style={{
            fontFamily: "Arial Black, Arial, sans-serif",
            fontSize: "24px",
            fontWeight: "900",
          }}
        >
          {reactivity}
        </text>

        {/* Text - Special (White - Bottom) */}
        <text
          x="30"
          y="67"
          textAnchor="middle"
          dominantBaseline="central"
          className="font-black fill-black"
          style={{
            fontFamily: "Arial Black, Arial, sans-serif",
            fontSize: "24px",
            fontWeight: "900",
          }}
        >
          {special || ""}
        </text>
      </svg>

      {/* Labels */}
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-[8px] text-gray-400 whitespace-nowrap">
        NFPA 704
      </div>
    </div>
  );
}
