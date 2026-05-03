import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith("/_next") || path.startsWith("/icons") || path.startsWith("/api") || path === "/favicon.ico") {
    return NextResponse.next();
  }

  const cookies = request.cookies.getAll();
  const hasAuth = cookies.some(c => c.name.includes("auth-token"));

  if (path.startsWith("/login")) {
    if (hasAuth) return NextResponse.redirect(new URL("/dashboard", request.url));
    return NextResponse.next();
  }

  if (!hasAuth) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (path === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
