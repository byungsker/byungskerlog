import { NextRequest, NextResponse } from "next/server";
import { stackServerApp } from "@/stack/server";

const ALLOWED_EMAILS = ["extreme0728@gmail.com", "admin@byungskerlog.com"];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 체크하지 않을 경로들
  if (
    pathname.startsWith("/handler") ||
    pathname.startsWith("/unauthorized") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt"
  ) {
    return NextResponse.next();
  }

  if (!stackServerApp) {
    return NextResponse.next();
  }

  const user = await stackServerApp.getUser();

  // 로그인된 사용자가 화이트리스트에 없으면 unauthorized 페이지로
  if (user && user.primaryEmail && !ALLOWED_EMAILS.includes(user.primaryEmail)) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  // admin 페이지 접근 시 로그인 체크
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const signInUrl = new URL("/handler/sign-in", request.url);
      signInUrl.searchParams.set("after", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)",
  ],
};
