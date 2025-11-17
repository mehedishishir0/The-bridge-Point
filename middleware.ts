
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { allRoutes } from "./lib/allRoutes ";


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicRoutes = [
    "/login",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/_next",
    "/favicon.ico",
    "/not-access",
  ];

  if (publicRoutes.some((route) => pathname.startsWith(route))) return NextResponse.next();

  // Get JWT token from NextAuth
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = token.role;

  // Superadmin: full access
  if (userRole === "superadmin") return NextResponse.next();

  let accessRoutes: string[] = [];

  if (userRole === "admin") {
    try {
      const apiUrl = new URL(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/profile`);

      // Fetch profile dynamically, no caching
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
        },
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        accessRoutes = data?.data?.accessRoutes || [];
      } else {
        console.error("Failed to fetch profile, status:", response.status);
      }
    } catch (err) {
      console.error("Middleware fetch error:", err);
      const url = new URL("/not-access", request.url);
      url.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(url);
    }

    // "/" route allow for admin
    if (pathname === "/") return NextResponse.next();

    // Check if route is allowed
    const isAllowed = allRoutes.some(
      (route) => accessRoutes.includes(route.value) && pathname.includes(route.value)
    );

    if (!isAllowed) {
      const url = new URL("/not-access", request.url);
      url.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(url);
    }
  }

  // Other roles cannot access "/"
  if (pathname === "/") {
    const url = new URL("/not-access", request.url);
    url.searchParams.set("error", "unauthorized");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api/auth).*)"],
};
