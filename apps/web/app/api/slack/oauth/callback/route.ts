import { NextRequest, NextResponse } from "next/server";

import { auth0 } from "@/lib/auth0";
import {
  exchangeSlackCodeForTokens,
  getApiBaseUrl,
  getAppBaseUrl,
  SLACK_OAUTH_STATE_COOKIE,
} from "@/lib/slack-oauth";

type SlackOauthMessage = {
  type: "dropwise-slack-oauth-complete" | "dropwise-slack-oauth-error";
  message: string;
  tenantId?: string;
  workspaceId?: string;
};

function renderPopupPage(payload: SlackOauthMessage) {
  const targetOrigin = new URL(getAppBaseUrl()).origin;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${payload.type === "dropwise-slack-oauth-complete" ? "Slack connected" : "Slack connection failed"}</title>
  </head>
  <body style="font-family: Arial, sans-serif; padding: 24px; color: #0f172a;">
    <p>${payload.message}</p>
    <script>
      (function () {
        const payload = ${JSON.stringify(payload)};
        const targetOrigin = ${JSON.stringify(targetOrigin)};

        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(payload, targetOrigin);
          window.close();
        }
      })();
    </script>
  </body>
</html>`;
}

function buildPopupResponse(payload: SlackOauthMessage) {
  const response = new NextResponse(renderPopupPage(payload), {
    status: payload.type === "dropwise-slack-oauth-complete" ? 200 : 400,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });

  response.cookies.set({
    name: SLACK_OAUTH_STATE_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/slack/oauth",
    expires: new Date(0),
  });

  return response;
}

function readStateCookie(cookieValue: string | undefined) {
  if (!cookieValue) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(cookieValue, "base64url").toString("utf8")) as {
      state?: string;
      tenantId?: string;
      expiresAt?: number;
    };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth0.getSession(request);

    if (!session) {
      return buildPopupResponse({
        type: "dropwise-slack-oauth-error",
        message: "Your session expired before Slack could finish connecting.",
      });
    }

    const code = request.nextUrl.searchParams.get("code")?.trim();
    const state = request.nextUrl.searchParams.get("state")?.trim();
    const slackError = request.nextUrl.searchParams.get("error")?.trim();
    const savedState = readStateCookie(
      request.cookies.get(SLACK_OAUTH_STATE_COOKIE)?.value,
    );

    if (slackError) {
      return buildPopupResponse({
        type: "dropwise-slack-oauth-error",
        message: `Slack OAuth was denied: ${slackError}.`,
      });
    }

    if (!code || !state) {
      return buildPopupResponse({
        type: "dropwise-slack-oauth-error",
        message: "Slack OAuth callback is missing the required code or state.",
      });
    }

    if (
      !savedState ||
      !savedState.state ||
      !savedState.tenantId ||
      !savedState.expiresAt ||
      savedState.state !== state ||
      savedState.expiresAt < Date.now()
    ) {
      return buildPopupResponse({
        type: "dropwise-slack-oauth-error",
        message: "Slack OAuth state is invalid or expired.",
      });
    }

    const tokens = await exchangeSlackCodeForTokens(code);

    if (!tokens.workspaceId) {
      return buildPopupResponse({
        type: "dropwise-slack-oauth-error",
        message: "Slack OAuth did not return a workspace ID.",
      });
    }

    const apiBaseUrl = getApiBaseUrl();
    const saveResponse = await fetch(`${apiBaseUrl}/api/app/secrets/slack`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tenantId: savedState.tenantId,
        workspaceId: tokens.workspaceId,
        botToken: tokens.botToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: tokens.tokenExpiresAt,
      }),
      cache: "no-store",
    });

    if (!saveResponse.ok) {
      throw new Error(
        `Saving Slack tokens failed with status ${saveResponse.status}.`,
      );
    }

    return buildPopupResponse({
      type: "dropwise-slack-oauth-complete",
      message: "Slack workspace connected.",
      tenantId: savedState.tenantId,
      workspaceId: tokens.workspaceId,
    });
  } catch (error) {
    return buildPopupResponse({
      type: "dropwise-slack-oauth-error",
      message:
        error instanceof Error
          ? error.message
          : "Slack OAuth failed unexpectedly.",
    });
  }
}
