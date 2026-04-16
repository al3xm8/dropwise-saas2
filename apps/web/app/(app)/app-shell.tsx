"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Operational overview",
    available: true,
  },
  {
    href: "/feed",
    label: "Feed",
    description: "Live ticket activity",
    available: true,
  },
  {
    href: "/rules",
    label: "Rules",
    description: "Routing behavior",
    available: false,
  },
  {
    href: "/settings",
    label: "Settings",
    description: "Tenant configuration",
    available: false,
  },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavCard({
  active,
  label,
  description,
  available,
}: {
  active: boolean;
  label: string;
  description: string;
  available: boolean;
}) {
  return (
    <div
      className={`w-full border-l-2 px-4 py-3 transition-all ${
        active
          ? "border-l-[#2563eb] bg-[linear-gradient(90deg,rgba(219,234,254,0.76)_0%,rgba(255,255,255,0)_100%)]"
          : available
            ? "border-l-transparent hover:border-l-slate-300 hover:bg-white/58"
            : "border-l-transparent opacity-70"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={`text-[0.98rem] font-semibold tracking-[-0.025em] ${
            active ? "text-slate-950" : "text-slate-700"
          }`}
        >
          {label}
        </span>
        <span
          className={`rounded-full px-2 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] ${
            available
              ? active
                ? "bg-[#dbeafe] text-[#1d4ed8]"
                : "bg-slate-100 text-slate-500"
              : "bg-slate-100 text-slate-400"
          }`}
        >
          {available ? "Live" : "Next"}
        </span>
      </div>
      <p
        className={`mt-1 text-[0.82rem] leading-6 tracking-[-0.015em] ${
          active ? "text-slate-600" : "text-slate-500"
        }`}
      >
        {description}
      </p>
    </div>
  );
}

export function AppShell({
  userEmail,
  accountType,
  children,
}: {
  userEmail: string;
  accountType: "OWNER" | "ADMIN" | "MEMBER";
  children: ReactNode;
}) {
  const pathname = usePathname();
  const currentItem =
    navItems.find((item) => isActivePath(pathname, item.href)) ?? navItems[0];

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.14),_transparent_22%),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_46%,_#f6f3ee_100%)] text-slate-950">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-6%] top-[2%] h-72 w-72 rounded-full bg-[#60a5fa]/24 blur-3xl" />
        <div className="absolute left-[9%] top-[18%] h-48 w-48 rounded-full bg-[#facc15]/18 blur-3xl" />
        <div className="absolute right-[5%] top-[8%] h-64 w-64 rounded-full bg-[#34d399]/18 blur-3xl" />
        <div className="absolute right-[18%] top-[24%] h-44 w-44 rounded-full bg-[#c084fc]/16 blur-3xl" />
        <div className="absolute left-[18%] bottom-[15%] h-56 w-56 rounded-full bg-[#fb7185]/16 blur-3xl" />
        <div className="absolute right-[7%] bottom-[10%] h-72 w-72 rounded-full bg-[#60a5fa]/18 blur-3xl" />
      </div>
      <div className="flex min-h-screen w-full flex-col md:flex-row">
        <aside className="hidden w-[280px] shrink-0 border-r border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(248,250,255,0.88)_100%)] px-5 py-6 shadow-[inset_-1px_0_0_rgba(148,163,184,0.08)] backdrop-blur md:flex md:flex-col">
          <div className="flex items-center justify-center px-3 py-5">
            <Link
              href="/dashboard"
              className="flex w-full items-center justify-center gap-1.5"
            >
              <Image
                src="/wisedrop-icon.svg"
                alt="Dropwise icon"
                width={48}
                height={48}
                priority
                className="h-12 w-12"
              />
              <span className="text-[1.8rem] font-semibold tracking-[-0.035em] text-slate-950">
                Dropwise
              </span>
            </Link>
          </div>

          <div className="mt-8 px-4 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Workspace
          </div>

          <nav className="mt-3 space-y-1">
            {navItems.map((item) => {
              const active = isActivePath(pathname, item.href);

              if (!item.available) {
                return (
                  <div key={item.href}>
                    <NavCard
                      active={active}
                      label={item.label}
                      description={item.description}
                      available={item.available}
                    />
                  </div>
                );
              }

              return (
                <Link key={item.href} href={item.href} className="block w-full">
                  <NavCard
                    active={active}
                    label={item.label}
                    description={item.description}
                    available={item.available}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-slate-200/80 pt-5">
            <div className="px-4">
              <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Account
              </div>
              <div className="mt-3 text-[0.92rem] font-medium tracking-[-0.02em] text-slate-900">
                {userEmail}
              </div>
              <div className="mt-2 inline-flex rounded-full bg-[#eff6ff] px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[#1d4ed8] ring-1 ring-[#dbeafe]">
                {accountType}
              </div>
            </div>

            <div className="mt-4 px-4">
              <Link
                href="/auth/logout"
                className="flex w-full items-center justify-center rounded-md border border-slate-200/80 bg-white/88 px-4 py-3 text-[0.9rem] font-medium tracking-[-0.02em] text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
              >
                Sign out
              </Link>
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="border-b border-white/75 bg-white/72 px-4 py-4 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset] backdrop-blur md:hidden">
            <div className="flex items-center justify-between gap-4">
              <Link href="/dashboard" className="inline-flex items-center gap-2">
                <Image
                  src="/wisedrop-icon.svg"
                  alt="Dropwise icon"
                  width={30}
                  height={30}
                  priority
                  className="h-[30px] w-[30px]"
                />
                <span className="text-[1rem] font-semibold tracking-[-0.03em] text-slate-950">
                  Dropwise
                </span>
              </Link>
              <div className="rounded-full border border-slate-200/80 bg-white/84 px-3 py-1.5 text-[0.82rem] font-medium tracking-[-0.015em] text-slate-600">
                {currentItem.label}
              </div>
            </div>

            <nav className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {navItems.map((item) => {
                const active = isActivePath(pathname, item.href);

                if (!item.available) {
                  return (
                    <div
                      key={item.href}
                      className="shrink-0 rounded-full border border-slate-200/80 bg-white/68 px-3 py-2 text-[0.88rem] font-medium tracking-[-0.02em] text-slate-400"
                    >
                      {item.label}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`shrink-0 rounded-full border px-3 py-2 text-[0.88rem] font-medium tracking-[-0.02em] transition-colors ${
                      active
                        ? "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]"
                        : "border-slate-200/80 bg-white/88 text-slate-600"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
            <div className="mx-auto max-w-[1560px] 2xl:max-w-[1680px]">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
