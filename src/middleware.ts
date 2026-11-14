import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import {
  readPortalSessionCookieFromRequest,
  verifyPortalSession,
} from "@/lib/patient-auth";

export default auth(async (req) => {
  const { pathname } = req.nextUrl;

  // Public routes - no auth required
  const publicRoutes = ["/login", "/register", "/api/auth"];

  // Landing page - always public
  if (pathname === "/") {
    return NextResponse.next();
  }
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Patient portal: public endpoints (login/logout) + gated area
  const isPortalPublic =
    pathname === "/p/login" ||
    pathname === "/api/portal/login" ||
    pathname === "/api/portal/logout";
  const isPortalArea = pathname.startsWith("/p/") || pathname.startsWith("/api/portal/");
  const isPortalChangePassword = pathname === "/p/change-password";

  // API routes that handle their own auth
  // (conversations + messages handle dual auth internally: staff or portal)
  const isOpenApi =
    pathname.startsWith("/api/chat") ||
    pathname.startsWith("/api/conversations") ||
    pathname.startsWith("/api/messages");

  if (isPublicRoute || isOpenApi) {
    return NextResponse.next();
  }

  // Gate patient portal area with portal session cookie
  if (isPortalArea) {
    if (isPortalPublic) {
      return NextResponse.next();
    }
    const token = readPortalSessionCookieFromRequest(req);
    const session = token ? await verifyPortalSession(token) : null;
    if (!session) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const loginUrl = new URL("/p/login", req.url);
      if (pathname !== "/p/login") loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Force password change if flagged — except for the change-password routes themselves
    if (
      session.mustChangePassword &&
      !isPortalChangePassword &&
      pathname !== "/api/portal/change-password" &&
      pathname !== "/api/portal/me" &&
      pathname !== "/api/portal/logout"
    ) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Password change required" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/p/change-password", req.url));
    }
    return NextResponse.next();
  }

  // Protect all other staff routes
  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.jpg$).*)",
  ],
};
