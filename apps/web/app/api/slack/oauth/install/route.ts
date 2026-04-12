import { randomBytes } from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { auth0 } from "@/lib/auth0";
import {
  buildSlackAuthorizeUrl,
  SLACK_OAUTH_STATE_COOKIE,
  SLACK_OAUTH_STATE_TTL_MS,
} from "@/lib/slack-oauth";

export async function GET(request: NextRequest) {
  const session = await auth0.getSession(request);

  if (!session) {
    return NextResponse.redirect(
      new URL("/auth/login?returnTo=/onboarding", request.url),
    );
  }

  const tenantId = request.nextUrl.searchParams.get("tenantId")?.trim();

  if (!tenantId) {
    return NextResponse.json(
      { message: "Missing tenantId for Slack OAuth install." },
      { status: 400 },
    );
  }

  const state = randomBytes(24).toString("base64url");
  const expiresAt = Date.now() + SLACK_OAUTH_STATE_TTL_MS;
  const authorizeUrl = buildSlackAuthorizeUrl(state);
  const response = NextResponse.redirect(authorizeUrl);

  response.cookies.set({
    name: SLACK_OAUTH_STATE_COOKIE,
    value: Buffer.from(
      JSON.stringify({
        state,
        tenantId,
        expiresAt,
      }),
    ).toString("base64url"),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/slack/oauth",
    expires: new Date(expiresAt),
  });

  return response;
}
