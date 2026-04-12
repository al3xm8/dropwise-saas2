"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const navItems = [
    { label: "Product", href: "#core-workflow" },
    { label: "Pricing", href: "/pricing" },
  ];
  const integrations = [
    {
      name: "ConnectWise",
      src: "/connectwise-logo-transparent.png",
      width: 2705,
      height: 421,
      className: "h-8",
    },
    {
      name: "Jira",
      src: "/jira-logo-transparent.png",
      width: 108,
      height: 23,
      className: "h-9",
    },
    {
      name: "Zendesk",
      src: "/zendesk-logo-transparent.png",
      width: 88,
      height: 44,
      className: "h-16",
    },
    {
      name: "ServiceNow",
      src: "/servicenow-logo-transparent.png",
      width: 112,
      height: 20,
    },
    {
      name: "Salesforce",
      src: "/salesforce-logo-transparent.png",
      width: 112,
      height: 15,
    },
    {
      name: "Slack",
      src: "/slack-logo-transparent.png",
      width: 96,
      height: 39,
      className: "h-12",
    },
    {
      name: "Microsoft Teams",
      src: "/teams-logo-transparent.png",
      width: 92,
      height: 30,
      className: "h-12",
    },
    {
      name: "Outlook",
      src: "/outlook-logo-transparent.png",
      width: 112,
      height: 16,
    },
    {
      name: "Gmail",
      src: "/gmail-logo-transparent.png",
      width: 92,
      height: 52,
      className: "h-14",
    },
    {
      name: "iMessage",
      src: "/imessage-logo-transparent.png",
      width: 76,
      height: 51,
      className: "h-18",
    },
  ];
  const ticketingPlatforms = integrations.slice(0, 5);
  const messagingPlatforms = integrations.slice(5);
  const workflowSteps = [
    {
      step: "01",
      title: "Connect your systems",
      description:
        "Link your ticketing platform and messaging workspace to start moving ticket activity into team communication.",
      accent: {
        dot: "bg-[#ff6b6b]",
        glow: "shadow-[0_0_18px_rgba(255,107,107,0.45)]",
        bar: "bg-[linear-gradient(90deg,#fecaca,#ff6b6b)]",
      },
    },
    {
      step: "02",
      title: "Route tickets by rule",
      description:
        "Send tickets to the right messaging platforms and channels based on the workflow logic that fits your service desk.",
      accent: {
        dot: "bg-[#f59e0b]",
        glow: "shadow-[0_0_18px_rgba(245,158,11,0.45)]",
        bar: "bg-[linear-gradient(90deg,#fde68a,#f59e0b)]",
      },
    },
    {
      step: "03",
      title: "Respond from messaging",
      description:
        "Teams can see tickets, respond from the messaging platforms your rules send them to, and keep the right people involved when routing rules assign ownership.",
      accent: {
        dot: "bg-[#10b981]",
        glow: "shadow-[0_0_18px_rgba(16,185,129,0.45)]",
        bar: "bg-[linear-gradient(90deg,#a7f3d0,#10b981)]",
      },
    },
  ];
  const integrationExplainers = {
    overall: {
      label: "Overall",
      title: "Dropwise connects ticketing intake to messaging response.",
      description:
        "Tickets begin in service desk systems, move through Dropwise routing logic, and arrive in the messaging platforms where teams stay aligned and act.",
    },
    source: {
      label: "Source",
      title: "Tickets start in the systems your team already runs.",
      description:
        "Requests originate in tools like ConnectWise, Jira, Zendesk, ServiceNow, and Salesforce, where work is already tracked and owned.",
    },
    route: {
      label: "Route through Dropwise",
      title: "Dropwise applies the routing logic between both sides.",
      description:
        "Rules decide which messaging platform and channel should receive the ticket activity, keeping delivery structured instead of manual.",
    },
    destination: {
      label: "Destination",
      title: "Teams receive ticket context where they actually respond.",
      description:
        "Messaging platforms become the operational surface for visibility and response after Dropwise sends the ticket to the right place.",
    },
  } as const;
  const integrationStages = [
    "overall",
    "source",
    "route",
    "destination",
  ] as const;
  const [activeIntegrationStage, setActiveIntegrationStage] =
    useState<keyof typeof integrationExplainers>("overall");
  const activeIntegrationCopy =
    integrationExplainers[activeIntegrationStage];
  const activeIntegrationIndex = integrationStages.indexOf(
    activeIntegrationStage,
  );
  const integrationOuterCardClass =
    activeIntegrationStage === "source"
      ? "border-[#fb7185]/45 shadow-[0_24px_60px_rgba(251,113,133,0.10)]"
      : activeIntegrationStage === "route"
        ? "border-[#60a5fa]/45 shadow-[0_24px_60px_rgba(59,130,246,0.10)]"
        : activeIntegrationStage === "destination"
          ? "border-[#34d399]/45 shadow-[0_24px_60px_rgba(52,211,153,0.10)]"
          : "border-slate-200/70 shadow-[0_24px_60px_rgba(15,23,42,0.05)]";

  const goToPreviousIntegrationStage = () => {
    const previousIndex =
      (activeIntegrationIndex - 1 + integrationStages.length) %
      integrationStages.length;
    setActiveIntegrationStage(integrationStages[previousIndex]);
  };

  const goToNextIntegrationStage = () => {
    const nextIndex = (activeIntegrationIndex + 1) % integrationStages.length;
    setActiveIntegrationStage(integrationStages[nextIndex]);
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(122,134,255,0.22),_transparent_28%),linear-gradient(180deg,_#f7f9fe_0%,_#edf2ff_40%,_#f7f4ee_100%)]">
      <header className="px-4 pt-5 sm:px-6 lg:px-10">
        <div className="mx-auto flex h-16 w-full max-w-[1240px] items-center justify-between rounded-full bg-white/55 px-4 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_18px_40px_rgba(19,34,87,0.08)] ring-1 ring-white/80 backdrop-blur-md sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-0.5 text-slate-950 transition-all duration-200 hover:text-[#3b82f6] hover:[text-shadow:0_0_18px_rgba(59,130,246,0.28)]"
          >
            <Image
              src="/wisedrop-icon.svg"
              alt="Dropwise icon"
              width={26}
              height={26}
              priority
              className="h-[26px] w-[26px]"
            />
            <span className="text-[1.05rem] font-semibold tracking-[-0.03em]">
              dropwise
            </span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-[0.95rem] font-medium tracking-[-0.015em] text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:text-slate-950"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <Link
              href="/signin"
              className="rounded-full px-3 py-2 text-[0.94rem] font-medium tracking-[-0.015em] text-slate-700 transition-colors hover:text-slate-950"
            >
              Sign in
            </Link>
            <Link
              href="/contact-sales"
              className="inline-flex items-center rounded-full bg-[#3b82f6] px-4 py-2 text-[0.94rem] font-semibold tracking-[-0.015em] shadow-[0_10px_24px_rgba(59,130,246,0.28),0_0_22px_rgba(59,130,246,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#2f76ef] hover:shadow-[0_14px_30px_rgba(59,130,246,0.34),0_0_28px_rgba(59,130,246,0.28)]"
              style={{ color: "#fff" }}
            >
              Contact sales
            </Link>
          </div>

          <button
            type="button"
            aria-label="Open navigation"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-white/70 hover:text-slate-950 sm:hidden"
          >
            <span className="sr-only">Open navigation</span>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </svg>
          </button>
        </div>
      </header>

      <section className="relative overflow-hidden px-4 pb-20 pt-14 sm:px-6 sm:pb-24 lg:px-10 lg:pb-32 lg:pt-18">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-0 h-[44rem] bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.82),transparent_20%),radial-gradient(circle_at_72%_18%,rgba(59,130,246,0.14),transparent_22%),radial-gradient(circle_at_88%_32%,rgba(125,211,252,0.28),transparent_18%),radial-gradient(circle_at_54%_58%,rgba(99,102,241,0.12),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.16),transparent_72%)]" />
          <div className="absolute right-[8%] top-[10%] h-52 w-52 rounded-full bg-[#fb7185]/28 blur-3xl" />
          <div className="absolute left-[12%] top-[16%] h-40 w-40 rounded-full bg-[#facc15]/26 blur-3xl" />
          <div className="absolute bottom-[18%] right-[18%] h-64 w-64 rounded-full bg-[#34d399]/16 blur-3xl" />
          <div className="absolute left-[34%] bottom-[10%] h-44 w-44 rounded-full bg-[#60a5fa]/14 blur-3xl" />
          <div className="absolute right-[34%] top-[30%] h-36 w-36 rounded-full bg-[#c084fc]/14 blur-3xl" />
          <svg
            aria-hidden="true"
            viewBox="0 0 1440 900"
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="hero-flow-wide" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(148,163,184,0.04)" />
                <stop offset="40%" stopColor="rgba(59,130,246,0.22)" />
                <stop offset="100%" stopColor="rgba(125,211,252,0.06)" />
              </linearGradient>
            </defs>
            <path
              d="M-80 356C134 292 305 250 486 278C667 306 802 396 1010 392C1218 388 1326 260 1510 180"
              fill="none"
              stroke="url(#hero-flow-wide)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="10 16"
            />
            <path
              d="M-120 592C154 540 324 470 504 486C684 502 840 620 1024 620C1208 620 1336 494 1528 420"
              fill="none"
              stroke="url(#hero-flow-wide)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="12 18"
            />
          </svg>
        </div>

        <div className="relative mx-auto grid w-full max-w-[1240px] grid-cols-12 gap-y-6">
          <div className="col-span-12 pt-6 sm:pt-8 lg:col-span-11 lg:col-start-2 lg:pt-10">
            <div className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-slate-700">
              <span className="text-[#2563eb]">Ticketing into messaging</span>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-11 lg:col-start-2">
            <div className="max-w-[72rem]">
              <h1 className="max-w-[19ch] text-[2.2rem] font-semibold leading-[0.98] tracking-[-0.065em] text-slate-950 sm:text-[3.15rem] lg:text-[4.1rem]">
                <span className="block">
                  Bring your ticketing workflow into the messaging tools your IT
                  team already uses.
                </span>
                <span className="mt-4 block max-w-[42rem] text-[1.02rem] font-medium leading-8 tracking-[-0.025em] text-slate-600 sm:text-[1.1rem]">
                  Dropwise sends tickets from systems like ConnectWise, Jira,
                  and Zendesk into tools like Slack and Microsoft Teams so
                  teams can triage and respond faster without leaving chat.
                </span>
              </h1>
            </div>
          </div>

          <div className="col-span-12 mt-2 lg:col-span-10 lg:col-start-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/signin"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[#3b82f6] px-6 text-[0.96rem] font-semibold tracking-[-0.02em] shadow-[0_12px_28px_rgba(59,130,246,0.28),0_0_26px_rgba(59,130,246,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#2f76ef] hover:shadow-[0_16px_36px_rgba(59,130,246,0.32),0_0_34px_rgba(59,130,246,0.22)]"
                style={{ color: "#fff" }}
              >
                Get started
              </Link>
              <Link
                href="/contact-sales"
                className="inline-flex h-12 items-center justify-center rounded-full bg-white/70 px-6 text-[0.96rem] font-semibold tracking-[-0.02em] text-slate-800 shadow-[0_10px_24px_rgba(148,163,184,0.08)] ring-1 ring-white/80 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-slate-950"
              >
                Contact sales
              </Link>
            </div>
          </div>

          <div className="col-span-12 mt-2 lg:col-span-10 lg:col-start-2">
            <div className="flex items-center gap-5 text-[0.9rem] font-medium tracking-[-0.02em] text-slate-500">
              <span className="shrink-0 text-slate-400">Works with</span>
              <div className="hero-marquee-mask relative min-w-0 flex-1 overflow-hidden">
                <div className="hero-marquee-track flex min-w-max items-center gap-0 whitespace-nowrap will-change-transform">
                  {[0, 1, 2].map((copy) => (
                    <div
                      key={copy}
                      className="flex shrink-0 items-center gap-5 pr-5"
                      aria-hidden={copy > 0}
                    >
                      {integrations.map((platform, index) => (
                        <div
                          key={`${copy}-${platform.name}`}
                          className="flex shrink-0 items-center gap-5"
                        >
                          <Image
                            src={platform.src}
                            alt={platform.name}
                            width={platform.width}
                            height={platform.height}
                            className={`${platform.className ?? "h-6"} w-auto object-contain opacity-75 saturate-[0.9] transition-opacity duration-200 hover:opacity-100`}
                          />
                          {index < integrations.length - 1 ? (
                            <span className="text-slate-300">|</span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="core-workflow"
        className="px-4 pb-18 sm:px-6 sm:pb-22 lg:px-10 lg:pb-28"
      >
        <div className="relative mx-auto max-w-[1240px]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[0%] top-[4%] h-44 w-44 rounded-full bg-[#fb7185]/16 blur-3xl" />
            <div className="absolute left-[38%] top-[8%] h-40 w-40 rounded-full bg-[#f59e0b]/18 blur-3xl" />
            <div className="absolute right-[8%] bottom-[12%] h-48 w-48 rounded-full bg-[#10b981]/16 blur-3xl" />
            <div className="absolute right-[30%] top-[18%] h-40 w-40 rounded-full bg-[#60a5fa]/16 blur-3xl" />
          </div>

          <div className="max-w-[44rem]">
            <div className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
              Core workflow
            </div>
            <h2 className="mt-4 max-w-[14ch] text-[2.15rem] font-semibold leading-[1.02] tracking-[-0.055em] text-slate-950 sm:text-[2.8rem] lg:text-[3.35rem]">
              Move from intake to response in three clear steps.
            </h2>
            <p className="mt-4 max-w-[40rem] text-[1rem] leading-8 tracking-[-0.02em] text-slate-600 sm:text-[1.08rem]">
              Dropwise keeps the workflow simple: connect the systems you
              already use, route tickets where they belong, and let teams
              respond from messaging without losing structure.
            </p>
          </div>

          <div className="relative mt-10 overflow-hidden rounded-[2rem] border border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(241,245,255,0.72))] px-5 py-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] sm:px-7 sm:py-8 lg:px-8 lg:py-9">
            <div className="pointer-events-none absolute inset-x-10 top-[5.8rem] hidden h-px bg-[linear-gradient(90deg,rgba(148,163,184,0.12),rgba(59,130,246,0.26),rgba(148,163,184,0.12))] lg:block" />

            <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
              {workflowSteps.map((item) => (
                <div
                  key={item.step}
                  className="relative rounded-[1.7rem] bg-white/76 px-5 py-5 shadow-[0_14px_40px_rgba(148,163,184,0.09)] ring-1 ring-white/80 backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Step {item.step}
                    </div>
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${item.accent.dot} ${item.accent.glow}`}
                    />
                  </div>

                  <h3 className="mt-5 text-[1.28rem] font-semibold tracking-[-0.04em] text-slate-950">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-[0.98rem] leading-7 tracking-[-0.02em] text-slate-600">
                    {item.description}
                  </p>

                  <div className="mt-6 h-1.5 w-full rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${item.accent.bar}`}
                      style={{
                        width:
                          item.step === "01"
                            ? "42%"
                            : item.step === "02"
                              ? "68%"
                              : "100%",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-18 sm:px-6 sm:pb-22 lg:px-10 lg:pb-26">
        <div className="relative mx-auto max-w-[1240px]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[-4%] top-[2%] h-48 w-48 rounded-full bg-[#fb7185]/18 blur-3xl" />
            <div className="absolute left-[26%] bottom-[10%] h-44 w-44 rounded-full bg-[#facc15]/20 blur-3xl" />
            <div className="absolute right-[22%] top-[10%] h-48 w-48 rounded-full bg-[#34d399]/18 blur-3xl" />
            <div className="absolute right-[-3%] bottom-[4%] h-56 w-56 rounded-full bg-[#60a5fa]/16 blur-3xl" />
          </div>

          <div className="relative">
            <div className="mx-auto mb-6 grid max-w-[64rem] grid-cols-[auto_1fr_auto] items-center gap-3">
              <button
                type="button"
                aria-label="Show previous integration stage"
                onClick={goToPreviousIntegrationStage}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-slate-500 shadow-[0_14px_34px_rgba(148,163,184,0.12)] ring-1 ring-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white hover:text-slate-900"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>

              <div className="grid grid-cols-2 gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400 sm:grid-cols-4 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setActiveIntegrationStage("overall")}
                  className={`inline-flex w-full items-center justify-center rounded-full px-3 py-2 text-center transition-all duration-200 ${
                    activeIntegrationStage === "overall"
                      ? "bg-white/80 text-slate-900 shadow-[0_10px_26px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70"
                      : "text-slate-400 hover:bg-white/60 hover:text-slate-700"
                  }`}
                >
                  Overall
                </button>
                <button
                  type="button"
                  onClick={() => setActiveIntegrationStage("source")}
                  className={`inline-flex w-full items-center justify-center rounded-full px-3 py-2 text-center transition-all duration-200 ${
                    activeIntegrationStage === "source"
                      ? "bg-white/80 text-[#e11d48] shadow-[0_10px_26px_rgba(251,113,133,0.12)] ring-1 ring-[#fb7185]/25"
                      : "text-slate-400 hover:bg-white/60 hover:text-slate-700"
                  }`}
                >
                  Source
                </button>
                <button
                  type="button"
                  onClick={() => setActiveIntegrationStage("route")}
                  className={`inline-flex w-full items-center justify-center rounded-full px-3 py-2 text-center transition-all duration-200 ${
                    activeIntegrationStage === "route"
                      ? "bg-white/80 text-[#2563eb] shadow-[0_10px_26px_rgba(59,130,246,0.14)] ring-1 ring-[#60a5fa]/25"
                      : "text-slate-400 hover:bg-white/60 hover:text-slate-700"
                  }`}
                >
                  Route through Dropwise
                </button>
                <button
                  type="button"
                  onClick={() => setActiveIntegrationStage("destination")}
                  className={`inline-flex w-full items-center justify-center rounded-full px-3 py-2 text-center transition-all duration-200 ${
                    activeIntegrationStage === "destination"
                      ? "bg-white/80 text-[#059669] shadow-[0_10px_26px_rgba(52,211,153,0.14)] ring-1 ring-[#34d399]/25"
                      : "text-slate-400 hover:bg-white/60 hover:text-slate-700"
                  }`}
                >
                  Destination
                </button>
              </div>

              <button
                type="button"
                aria-label="Show next integration stage"
                onClick={goToNextIntegrationStage}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-slate-500 shadow-[0_14px_34px_rgba(148,163,184,0.12)] ring-1 ring-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white hover:text-slate-900"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            </div>

            <div
              className={`relative mt-6 overflow-hidden rounded-[2.15rem] border bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(244,247,255,0.72))] px-5 py-6 transition-[border-color,box-shadow] duration-200 sm:px-7 sm:py-8 lg:px-10 lg:py-10 ${integrationOuterCardClass}`}
            >
              <div className="mx-auto max-w-[48rem] text-center">
                <div className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {activeIntegrationCopy.label}
                </div>
                <div className="mt-3 text-[1.2rem] font-semibold leading-[1.15] tracking-[-0.04em] text-slate-950 sm:text-[1.35rem]">
                  {activeIntegrationCopy.title}
                </div>
                <p className="mt-4 text-[0.98rem] leading-7 tracking-[-0.02em] text-slate-600">
                  {activeIntegrationCopy.description}
                </p>
              </div>

              <div className="relative overflow-hidden rounded-[1.9rem] bg-white/74 px-5 py-5 ring-1 ring-white/80 shadow-[0_18px_42px_rgba(148,163,184,0.08)] backdrop-blur-sm sm:px-6 sm:py-6">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-[linear-gradient(180deg,rgba(255,255,255,0.22),transparent)]" />
                <div className="pointer-events-none absolute inset-0">
                  <div
                    className={`absolute left-[8%] top-[12%] h-28 w-28 rounded-full blur-3xl transition-all duration-200 ${
                      activeIntegrationStage === "source" ||
                      activeIntegrationStage === "overall"
                        ? "bg-[#fb7185]/22 opacity-100"
                        : "bg-[#fb7185]/10 opacity-45"
                    }`}
                  />
                  <div
                    className={`absolute left-1/2 top-[20%] h-28 w-28 -translate-x-1/2 rounded-full blur-3xl transition-all duration-200 ${
                      activeIntegrationStage === "route" ||
                      activeIntegrationStage === "overall"
                        ? "bg-[#60a5fa]/24 opacity-100"
                        : "bg-[#60a5fa]/10 opacity-45"
                    }`}
                  />
                  <div
                    className={`absolute right-[8%] bottom-[12%] h-28 w-28 rounded-full blur-3xl transition-all duration-200 ${
                      activeIntegrationStage === "destination" ||
                      activeIntegrationStage === "overall"
                        ? "bg-[#34d399]/22 opacity-100"
                        : "bg-[#34d399]/10 opacity-45"
                    }`}
                  />
                </div>

                <div className="relative mt-6 grid gap-5 lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-8">
                  <div
                    className={`rounded-[1.45rem] bg-white/74 px-4 py-4 ring-1 transition-all duration-200 ${
                      activeIntegrationStage === "source"
                        ? "ring-[#fb7185]/45 shadow-[0_16px_34px_rgba(251,113,133,0.12)]"
                        : activeIntegrationStage === "overall"
                          ? "ring-slate-200/70 shadow-[0_14px_30px_rgba(148,163,184,0.07)]"
                          : "ring-white/80 opacity-72"
                    }`}
                  >
                    <div className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Ticketing systems
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5">
                      {ticketingPlatforms.map((platform) => (
                        <div
                          key={platform.name}
                          className="flex min-h-10 items-center justify-center"
                        >
                          <Image
                            src={platform.src}
                            alt={platform.name}
                            width={platform.width}
                            height={platform.height}
                            className={`${platform.className ?? "h-6"} w-auto object-contain opacity-85`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="relative flex items-center justify-center py-2 lg:min-h-[14rem]">
                    <div
                      className={`absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[linear-gradient(180deg,rgba(148,163,184,0),rgba(59,130,246,0.28),rgba(148,163,184,0))] lg:hidden ${
                        activeIntegrationStage === "route" ||
                        activeIntegrationStage === "overall"
                          ? "opacity-100"
                          : "opacity-55"
                      }`}
                    />
                    <div
                      className={`hidden h-px flex-1 bg-[linear-gradient(90deg,rgba(148,163,184,0.06),rgba(59,130,246,0.34),rgba(148,163,184,0.06))] lg:block ${
                        activeIntegrationStage === "route" ||
                        activeIntegrationStage === "overall"
                          ? "opacity-100"
                          : "opacity-55"
                      }`}
                    />
                    <div className="relative mx-4 flex flex-col items-center gap-3">
                      <div
                        className={`absolute inset-[-1rem] rounded-full blur-2xl transition-all duration-200 ${
                          activeIntegrationStage === "route"
                            ? "bg-[#60a5fa]/26"
                            : activeIntegrationStage === "overall"
                              ? "bg-[#60a5fa]/22"
                              : "bg-[#60a5fa]/12"
                        }`}
                      />
                      <div
                        className={`relative flex h-20 w-20 items-center justify-center rounded-full bg-white/86 ring-1 backdrop-blur-sm transition-all duration-200 ${
                          activeIntegrationStage === "route"
                            ? "ring-[#60a5fa]/45 shadow-[0_20px_46px_rgba(59,130,246,0.22)]"
                            : activeIntegrationStage === "overall"
                              ? "ring-slate-200/70 shadow-[0_16px_36px_rgba(59,130,246,0.14)]"
                              : "ring-white/80 shadow-[0_14px_30px_rgba(59,130,246,0.12)]"
                        }`}
                      >
                        <Image
                          src="/wisedrop-icon.svg"
                          alt="Dropwise"
                          width={44}
                          height={44}
                          className="h-10 w-10"
                        />
                      </div>
                      <div className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
                        Dropwise
                      </div>
                    </div>
                    <div
                      className={`hidden h-px flex-1 bg-[linear-gradient(90deg,rgba(148,163,184,0.06),rgba(59,130,246,0.34),rgba(148,163,184,0.06))] lg:block ${
                        activeIntegrationStage === "route" ||
                        activeIntegrationStage === "overall"
                          ? "opacity-100"
                          : "opacity-55"
                      }`}
                    />
                  </div>

                  <div
                    className={`rounded-[1.45rem] bg-white/74 px-4 py-4 ring-1 transition-all duration-200 ${
                      activeIntegrationStage === "destination"
                        ? "ring-[#34d399]/45 shadow-[0_16px_34px_rgba(52,211,153,0.12)]"
                        : activeIntegrationStage === "overall"
                          ? "ring-slate-200/70 shadow-[0_14px_30px_rgba(148,163,184,0.07)]"
                          : "ring-white/80 opacity-72"
                    }`}
                  >
                    <div className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Messaging platforms
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5">
                      {messagingPlatforms.map((platform) => (
                        <div
                          key={platform.name}
                          className="flex min-h-10 items-center justify-center"
                        >
                          <Image
                            src={platform.src}
                            alt={platform.name}
                            width={platform.width}
                            height={platform.height}
                            className={`${platform.className ?? "h-6"} w-auto object-contain opacity-85`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-18 sm:px-6 sm:pb-22 lg:px-10 lg:pb-28">
        <div className="relative mx-auto max-w-[1240px]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[4%] top-[2%] h-52 w-52 rounded-full bg-[#fb7185]/18 blur-3xl" />
            <div className="absolute right-[4%] top-[2%] h-56 w-56 rounded-full bg-[#facc15]/18 blur-3xl" />
            <div className="absolute right-[18%] bottom-[8%] h-60 w-60 rounded-full bg-[#34d399]/14 blur-3xl" />
            <div className="absolute left-[28%] bottom-[-4%] h-56 w-56 rounded-full bg-[#60a5fa]/14 blur-3xl" />
            <div className="absolute left-[50%] top-[14%] h-44 w-44 rounded-full bg-[#c084fc]/14 blur-3xl" />
          </div>

          <div className="overflow-hidden rounded-[2.2rem] bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.24),transparent_24%),linear-gradient(135deg,#eef5ff_0%,#e7efff_44%,#f8f4ec_100%)] px-6 py-10 shadow-[0_28px_80px_rgba(15,23,42,0.08)] ring-1 ring-white/80 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
            <div className="max-w-[44rem]">
              <div className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
                Get started
              </div>
              <h2 className="mt-4 max-w-[14ch] text-[2.2rem] font-semibold leading-[1.02] tracking-[-0.055em] text-slate-950 sm:text-[2.95rem] lg:text-[3.6rem]">
                Make tickets easier to see, route, and respond to.
              </h2>
              <p className="mt-4 max-w-[40rem] text-[1rem] leading-8 tracking-[-0.02em] text-slate-600 sm:text-[1.08rem]">
                Connect your systems, send tickets where they belong, and let
                teams work from the messaging platforms they already use.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/signin"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[#3b82f6] px-6 text-[0.96rem] font-semibold tracking-[-0.02em] shadow-[0_12px_28px_rgba(59,130,246,0.28),0_0_26px_rgba(59,130,246,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#2f76ef] hover:shadow-[0_16px_36px_rgba(59,130,246,0.32),0_0_34px_rgba(59,130,246,0.22)]"
                style={{ color: "#fff" }}
              >
                Get started
              </Link>
              <Link
                href="/contact-sales"
                className="inline-flex h-12 items-center justify-center rounded-full bg-white/72 px-6 text-[0.96rem] font-semibold tracking-[-0.02em] text-slate-800 shadow-[0_10px_24px_rgba(148,163,184,0.08)] ring-1 ring-white/80 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-slate-950"
              >
                Contact sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="px-4 pb-10 sm:px-6 sm:pb-12 lg:px-10 lg:pb-14">
        <div className="relative mx-auto max-w-[1240px]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[-3%] top-[2%] h-44 w-44 rounded-full bg-[#60a5fa]/12 blur-3xl" />
            <div className="absolute right-[8%] top-[10%] h-40 w-40 rounded-full bg-[#c084fc]/12 blur-3xl" />
            <div className="absolute right-[0%] bottom-[-6%] h-48 w-48 rounded-full bg-[#34d399]/12 blur-3xl" />
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white/62 px-6 py-8 shadow-[0_20px_55px_rgba(15,23,42,0.05)] ring-1 ring-white/80 backdrop-blur-sm sm:px-8 sm:py-10 lg:px-10">
            <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr] lg:gap-8">
              <div className="max-w-[26rem]">
                <Link href="/" className="flex items-center gap-1 text-slate-950">
                  <Image
                    src="/wisedrop-icon.svg"
                    alt="Dropwise icon"
                    width={28}
                    height={28}
                    className="h-7 w-7"
                  />
                  <span className="text-[1.08rem] font-semibold tracking-[-0.03em]">
                    dropwise
                  </span>
                </Link>
                <p className="mt-4 text-[0.98rem] leading-7 tracking-[-0.02em] text-slate-600">
                  Ticketing into messaging for teams that need faster
                  visibility, cleaner routing, and response where work is
                  already happening.
                </p>
              </div>

              <div>
                <div className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Product
                </div>
                <div className="mt-4 flex flex-col gap-3 text-[0.96rem] font-medium tracking-[-0.02em] text-slate-700">
                  <Link
                    href="#core-workflow"
                    className="transition-colors hover:text-slate-950"
                  >
                    Product
                  </Link>
                  <Link
                    href="/pricing"
                    className="transition-colors hover:text-slate-950"
                  >
                    Pricing
                  </Link>
                  <Link
                    href="/signin"
                    className="transition-colors hover:text-slate-950"
                  >
                    Get started
                  </Link>
                </div>
              </div>

              <div>
                <div className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Company
                </div>
                <div className="mt-4 flex flex-col gap-3 text-[0.96rem] font-medium tracking-[-0.02em] text-slate-700">
                  <Link
                    href="/contact-sales"
                    className="transition-colors hover:text-slate-950"
                  >
                    Contact sales
                  </Link>
                  <Link
                    href="/signin"
                    className="transition-colors hover:text-slate-950"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-slate-200/70 pt-5 text-[0.88rem] tracking-[-0.02em] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <div>© 2026 Dropwise</div>
              <div>Built for ticket visibility and response in messaging.</div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
