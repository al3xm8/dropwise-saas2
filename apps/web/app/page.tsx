import Image from "next/image";

export default function Home() {
  const navItems = [
    "Product",
    "Use cases",
    "Developers",
    "Resources",
    "Pricing",
  ];
  const integrations = [
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
      className: "h-22",
    },
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(122,134,255,0.22),_transparent_28%),linear-gradient(180deg,_#f7f9fe_0%,_#edf2ff_40%,_#f7f4ee_100%)]">
      <header className="px-4 pt-5 sm:px-6 lg:px-10">
        <div className="mx-auto flex h-16 w-full max-w-[1240px] items-center justify-between rounded-full bg-white/55 px-4 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_18px_40px_rgba(19,34,87,0.08)] ring-1 ring-white/80 backdrop-blur-md sm:px-6">
          <a
            href="#"
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
          </a>

          <nav className="hidden items-center gap-7 lg:flex">
            {navItems.map((item) => (
              <a
                key={item}
                href="#"
                className="text-[0.95rem] font-medium tracking-[-0.015em] text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:text-slate-950"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <a
              href="#"
              className="rounded-full px-3 py-2 text-[0.94rem] font-medium tracking-[-0.015em] text-slate-700 transition-colors hover:text-slate-950"
            >
              Sign in
            </a>
            <a
              href="#"
              className="inline-flex items-center rounded-full bg-[#3b82f6] px-4 py-2 text-[0.94rem] font-semibold tracking-[-0.015em] text-white shadow-[0_10px_24px_rgba(59,130,246,0.28),0_0_22px_rgba(59,130,246,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#2f76ef] hover:shadow-[0_14px_30px_rgba(59,130,246,0.34),0_0_28px_rgba(59,130,246,0.28)]"
            >
              Contact sales
            </a>
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
          <div className="absolute right-[8%] top-[10%] h-52 w-52 rounded-full bg-[#7dd3fc]/30 blur-3xl" />
          <div className="absolute left-[12%] top-[16%] h-40 w-40 rounded-full bg-white/65 blur-3xl" />
          <div className="absolute bottom-[18%] right-[18%] h-64 w-64 rounded-full bg-[#60a5fa]/15 blur-3xl" />
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
                  Dropwise sends tickets from systems like Jira, Zendesk, and
                  ServiceNow into tools like Slack and Microsoft Teams so teams
                  can triage and respond faster without leaving chat.
                </span>
              </h1>
            </div>
          </div>

          <div className="col-span-12 mt-2 lg:col-span-10 lg:col-start-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="#"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[#3b82f6] px-6 text-[0.96rem] font-semibold tracking-[-0.02em] text-white shadow-[0_12px_28px_rgba(59,130,246,0.28),0_0_26px_rgba(59,130,246,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#2f76ef] hover:shadow-[0_16px_36px_rgba(59,130,246,0.32),0_0_34px_rgba(59,130,246,0.22)]"
              >
                Get started
              </a>
              <a
                href="#"
                className="inline-flex h-12 items-center justify-center rounded-full bg-white/70 px-6 text-[0.96rem] font-semibold tracking-[-0.02em] text-slate-800 shadow-[0_10px_24px_rgba(148,163,184,0.08)] ring-1 ring-white/80 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-slate-950"
              >
                Contact sales
              </a>
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
    </main>
  );
}
