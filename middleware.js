import { NextResponse } from "next/server";

const locales = ["es", "en"];
const defaultLocale = "es";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Ignorar archivos internos y estáticos
  if (pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // Si ya tiene locale → dejar pasar
  const pathnameHasLocale = locales.some((locale) =>
    pathname.startsWith(`/${locale}`),
  );

  if (pathnameHasLocale) {
    return NextResponse.next(); // 🔥 ESTO ES CLAVE
  }

  // Detectar idioma
  const acceptLang = request.headers.get("accept-language");
  const preferredLocale =
    acceptLang?.split(",")[0].split("-")[0] || defaultLocale;

  const locale = locales.includes(preferredLocale)
    ? preferredLocale
    : defaultLocale;

  return NextResponse.redirect(new URL(`/${locale}${pathname}`, request.url));
}

export const config = {
  matcher: ["/((?!_next).*)"],
};
