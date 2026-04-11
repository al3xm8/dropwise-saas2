import type { NextRequest } from "next/server";

import { auth0 } from "./lib/auth0";

export async function proxy(request: NextRequest) {
  return await auth0.middleware(request);
}

export const config = {
  matcher: [
    "/auth/:path*",
    "/onboarding/:path*",
    "/dashboard/:path*",
  ],
};
