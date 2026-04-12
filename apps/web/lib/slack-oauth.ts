const DEFAULT_SLACK_BOT_SCOPES =
  "chat:write,channels:read,channels:history,groups:history,commands,users:read";

export const SLACK_OAUTH_STATE_COOKIE = "dropwise_slack_oauth";
export const SLACK_OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

type SlackTokenExchangeResponse = {
  ok: boolean;
  error?: string;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  team?: {
    id?: string;
    name?: string;
  };
};

function requireEnv(name: string, value: string | undefined) {
  const normalized = value?.trim();

  if (!normalized) {
    throw new Error(`Missing ${name} configuration.`);
  }

  return normalized;
}

export function getAppBaseUrl() {
  return requireEnv("APP_BASE_URL", process.env.APP_BASE_URL);
}

export function getApiBaseUrl() {
  return requireEnv(
    "API_BASE_URL",
    process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL,
  );
}

export function getSlackOAuthConfig() {
  const appBaseUrl = getAppBaseUrl();

  return {
    clientId: requireEnv("SLACK_CLIENT_ID", process.env.SLACK_CLIENT_ID),
    clientSecret: requireEnv(
      "SLACK_CLIENT_SECRET",
      process.env.SLACK_CLIENT_SECRET,
    ),
    redirectUri:
      process.env.SLACK_OAUTH_REDIRECT_URI?.trim() ??
      `${appBaseUrl}/api/slack/oauth/callback`,
    botScopes:
      process.env.SLACK_OAUTH_BOT_SCOPES?.trim() ?? DEFAULT_SLACK_BOT_SCOPES,
    userScopes: process.env.SLACK_OAUTH_USER_SCOPES?.trim() ?? "",
    appBaseUrl,
  };
}

export function buildSlackAuthorizeUrl(state: string) {
  const { clientId, redirectUri, botScopes, userScopes } = getSlackOAuthConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    scope: botScopes,
    redirect_uri: redirectUri,
    state,
  });

  if (userScopes) {
    params.set("user_scope", userScopes);
  }

  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

export async function exchangeSlackCodeForTokens(code: string) {
  const { clientId, clientSecret, redirectUri } = getSlackOAuthConfig();
  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64",
  );
  const response = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: {
      Authorization: `Basic ${authHeader}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      redirect_uri: redirectUri,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Slack token exchange failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as SlackTokenExchangeResponse;

  if (!payload.ok) {
    throw new Error(
      `Slack token exchange failed: ${payload.error ?? "unknown_error"}.`,
    );
  }

  if (!payload.access_token) {
    throw new Error("Slack OAuth did not return a bot token.");
  }

  return {
    botToken: payload.access_token,
    refreshToken: payload.refresh_token ?? null,
    tokenExpiresAt: payload.expires_in
      ? Date.now() + payload.expires_in * 1000
      : null,
    workspaceId: payload.team?.id?.trim() ?? "",
  };
}
