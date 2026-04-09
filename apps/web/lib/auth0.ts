import { Auth0Client } from "@auth0/nextjs-auth0/server";

const scope = process.env.AUTH0_SCOPE ?? "openid profile email";
const audience = process.env.AUTH0_AUDIENCE;

export const auth0 = new Auth0Client({
  authorizationParameters: {
    scope,
    ...(audience ? { audience } : {}),
  },
});
