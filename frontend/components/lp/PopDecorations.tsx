"use client";

export function PopDecorations() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* top-left blob */}
      <svg
        className="absolute -left-24 -top-24 h-80 w-80 opacity-40 blur-[0.5px]"
        viewBox="0 0 200 200"
        fill="none"
      >
        <path
          d="M42.9,-55.7C58.7,-47.1,76.8,-39.2,82.9,-26C89.1,-12.8,83.2,5.7,73.6,20.8C64.1,35.9,50.8,47.6,36.5,57.6C22.2,67.7,6.9,76.1,-8.2,77.7C-23.2,79.3,-38,74.1,-51.7,64.7C-65.4,55.3,-78.1,41.6,-82.8,25.2C-87.4,8.8,-83.9,-10.2,-74.7,-25.3C-65.5,-40.4,-50.6,-51.6,-35.7,-60.6C-20.8,-69.7,-5.9,-76.6,6.7,-85.2C19.2,-93.8,27.1,-104,42.9,-55.7Z"
          transform="translate(100 100)"
          fill="rgb(165 180 252)"
          fillOpacity="0.35"
        />
      </svg>

      {/* top-right confetti */}
      <svg className="absolute -right-10 top-10 h-48 w-48 opacity-50" viewBox="0 0 200 200" fill="none">
        <circle cx="48" cy="56" r="8" fill="rgb(251 191 36)" fillOpacity="0.45" />
        <circle cx="140" cy="42" r="6" fill="rgb(34 211 238)" fillOpacity="0.4" />
        <circle cx="164" cy="98" r="10" fill="rgb(244 114 182)" fillOpacity="0.35" />
        <rect x="92" y="72" width="10" height="26" rx="5" fill="rgb(129 140 248)" fillOpacity="0.35" />
        <rect x="28" y="104" width="12" height="22" rx="6" fill="rgb(74 222 128)" fillOpacity="0.32" />
        <path d="M120 120l18-8 8 18-18 8z" fill="rgb(251 191 36)" fillOpacity="0.38" />
      </svg>

      {/* bottom wave */}
      <svg className="absolute -bottom-10 left-0 right-0 h-40 w-full opacity-50" viewBox="0 0 1440 240" fill="none">
        <path
          d="M0 160C120 140 240 110 360 120C480 130 600 190 720 190C840 190 960 130 1080 110C1200 90 1320 120 1440 140V240H0V160Z"
          fill="rgb(165 180 252)"
          fillOpacity="0.15"
        />
        <path
          d="M0 190C140 160 280 150 420 170C560 190 700 230 840 220C980 210 1120 160 1260 150C1320 145 1380 148 1440 155V240H0V190Z"
          fill="rgb(244 114 182)"
          fillOpacity="0.12"
        />
      </svg>
    </div>
  );
}
