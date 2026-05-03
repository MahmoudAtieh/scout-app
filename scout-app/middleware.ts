import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (
    path.startsWith("/_next") ||
    path.startsWith("/icons") ||
    path.startsWith("/api") ||
    path === "/manifest.json" ||
    path === "/favicon.ico" ||
    path === "/sw.js"
  ) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.getAll().find(c => c.name.includes("auth-token"));

  if (path.startsWith("/login")) {
    if (authCookie) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (!authCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (path === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
