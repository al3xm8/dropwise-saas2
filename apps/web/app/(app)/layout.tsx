import type { ReactNode } from "react";

import { auth0 } from "@/lib/auth0";

import { AppShell } from "./app-shell";

export default async function AuthenticatedAppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth0.getSession();
  const userEmail =
    typeof session?.user?.email === "string" && session.user.email.trim() !== ""
      ? session.user.email
      : "Signed-in account";

  return (
    <AppShell userEmail={userEmail} accountType="OWNER">
      {children}
    </AppShell>
  );
}
