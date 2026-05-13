import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/register", "/reset-password", "/portal/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Dejar pasar rutas públicas
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const isPortal = pathname.startsWith("/portal/");

  if (isPortal) {
    // Las rutas del portal usan su propio JWT — cookie separada
    const portalAuthHint = request.cookies.get("portal_access_token");
    if (!portalAuthHint) {
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
