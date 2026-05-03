import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isPublic = path.startsWith("/login") || 
                   path.startsWith("/_next") || 
                   path.startsWith("/icons") || 
                   path === "/manifest.json" ||
                   path === "/favicon.ico" ||
                   path === "/sw.js";

  if (isPublic) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.getAll().find(c => c.name.includes("auth-token"));

  if (!authCookie && !path.startsWith("/login")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (authCookie && path.startsWith("/login")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
