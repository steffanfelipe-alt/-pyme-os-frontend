import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/register", "/reset-password"];
const PORTAL_PUBLIC_PATHS = ["/portal/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Dejar pasar rutas públicas del dashboard
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Rutas del portal — usar portal_access_token como indicador de sesión
  if (pathname.startsWith("/portal")) {
    if (PORTAL_PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
      return NextResponse.next();
    }
    const portalHint = request.cookies.get("portal_access_token");
    if (!portalHint) {
      const loginUrl = new URL("/portal/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // El token vive en localStorage (client-side), no en cookies.
  // Para proteger rutas SSR usamos una cookie "access_token" que el cliente setea
  // junto con el token. Si no existe, redirigir al login.
  const authHint = request.cookies.get("access_token");

  if (!authHint) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
