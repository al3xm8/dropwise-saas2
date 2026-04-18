import { NextResponse, type NextRequest } from "next/server";

import { auth0 } from "./lib/auth0";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    const session = await auth0.getSession(request);
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  return await auth0.middleware(request);
}

export const config = {
  matcher: [
    "/",
    "/auth/:path*",
    "/onboarding/:path*",
    "/dashboard/:path*",
    "/feed/:path*",
    "/rules/:path*",
    "/settings/:path*",
  ],
};
