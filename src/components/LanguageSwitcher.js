"use client";

import { usePathname, useRouter } from "next/navigation";

function FlagMX() {
  return (
    <svg
      viewBox="0 0 640 480"
      className="h-4 w-6 rounded-sm overflow-hidden"
      aria-hidden="true"
    >
      <rect width="213.333" height="480" fill="#006847" />
      <rect x="213.333" width="213.333" height="480" fill="#ffffff" />
      <rect x="426.666" width="213.334" height="480" fill="#ce1126" />

      <g transform="translate(320 240)">
        <circle r="46" fill="#8b5a2b" opacity="0.15" />
        <circle r="26" fill="#8b5a2b" />
        <circle r="10" fill="#c9a227" />
      </g>
    </svg>
  );
}

function FlagUS() {
  return (
    <svg
      viewBox="0 0 640 480"
      className="h-4 w-6 rounded-sm overflow-hidden"
      aria-hidden="true"
    >
      <rect width="640" height="480" fill="#ffffff" />

      {Array.from({ length: 13 }).map((_, i) =>
        i % 2 === 0 ? (
          <rect
            key={i}
            y={i * 36.923}
            width="640"
            height="36.923"
            fill="#b22234"
          />
        ) : null,
      )}

      <rect width="280" height="260" fill="#3c3b6e" />
    </svg>
  );
}

export default function LanguageSwitcher({ locale, dict }) {
  const router = useRouter();
  const pathname = usePathname();

  const changeLanguage = (newLocale) => {
    if (newLocale === locale) return;

    const newPath = pathname.replace(/^\/(es|en)(?=\/|$)/, `/${newLocale}`);
    router.replace(newPath);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <span className="text-white/70">{dict.common.changeLanguage}</span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => changeLanguage("es")}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition
            ${
              locale === "es"
                ? "border-blue-400 bg-blue-500/20 text-white shadow-[0_0_20px_rgba(59,130,246,.25)]"
                : "border-white/15 bg-white/5 text-white/75 hover:bg-white/10"
            }`}
        >
          <FlagMX />
          <span>{dict.common.spanish}</span>
        </button>

        <button
          type="button"
          onClick={() => changeLanguage("en")}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition
            ${
              locale === "en"
                ? "border-blue-400 bg-blue-500/20 text-white shadow-[0_0_20px_rgba(59,130,246,.25)]"
                : "border-white/15 bg-white/5 text-white/75 hover:bg-white/10"
            }`}
        >
          <FlagUS />
          <span>{dict.common.english}</span>
        </button>
      </div>
    </div>
  );
}
