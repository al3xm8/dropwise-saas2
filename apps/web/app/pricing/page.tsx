import Image from "next/image";
import Link from "next/link";

const tiers = [
  {
    name: "Starter",
    price: "$49/mo",
    summary: "For testing, solo usage, and simple multi-system flows.",
    ctaLabel: "Get started",
    ctaHref: "/signin",
    note: "Best for getting two systems connected quickly without overbuilding the workflow.",
    features: [
      "Up to 2 integrations total",
      "Up to 5 routing rules",
      "Up to 3 destinations",
      "1,000 events/month included",
      "$10 per 1,000 events overage",
      "Guided self-serve setup",
      "Standard async support",
    ],
  },
  {
    name: "Growth",
    price: "$149/mo",
    summary: "For real internal IT teams connecting more of the daily workflow.",
    ctaLabel: "Get started",
    ctaHref: "/signin",
    note: "Best for teams connecting several systems without needing fully custom packaging yet.",
    features: [
      "Up to 5 integrations",
      "Up to 20 routing rules",
      "Up to 10 destinations",
      "5,000 events/month included",
      "$8 per 1,000 events overage",
      "Broader routing coverage",
      "Production-ready internal deployment",
    ],
  },
  {
    name: "Pro",
    price: "$349/mo",
    summary: "For MSPs and complex multi-system routing at higher operational scale.",
    ctaLabel: "Contact sales",
    ctaHref: "/contact-sales",
    note: "Best for routing across a large stack with priority support and fewer packaging limits.",
    features: [
      "Up to 10 integrations",
      "Unlimited routing rules",
      "Unlimited destinations",
      "15,000 events/month included",
      "$6 per 1,000 events overage",
      "Priority support",
      "High-complexity routing coverage",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    summary: "For large environments, procurement-driven rollout, and advanced operational control.",
    ctaLabel: "Contact sales",
    ctaHref: "/contact-sales",
    note: "Best for multi-team deployment, custom support, and negotiated high-volume usage.",
    features: [
      "Unlimited integrations",
      "Unlimited routing",
      "Unlimited destinations",
      "Multi-team environments",
      "$3-$5 per 1,000 events at scale",
      "Dedicated support",
      "Room for advanced admin and audit features",
    ],
  },
];

const comparisonRows = [
  {
    label: "Best for",
    starter: "Simple flows and early production use",
    growth: "Real internal IT team deployment",
    pro: "Complex routing programs and MSP use",
    enterprise: "Large-scale custom rollout",
  },
  {
    label: "Integrations",
    starter: "Up to 2",
    growth: "Up to 5",
    pro: "Up to 10",
    enterprise: "Unlimited",
  },
  {
    label: "Routing rules",
    starter: "Up to 5",
    growth: "Up to 20",
    pro: "Unlimited",
    enterprise: "Unlimited",
  },
  {
    label: "Destinations",
    starter: "Up to 3",
    growth: "Up to 10",
    pro: "Unlimited",
    enterprise: "Unlimited",
  },
  {
    label: "Included events",
    starter: "1,000/month",
    growth: "5,000/month",
    pro: "15,000/month",
    enterprise: "Custom volume",
  },
  {
    label: "Support path",
    starter: "Standard async support",
    growth: "Operational self-serve",
    pro: "Priority support",
    enterprise: "Dedicated support",
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(122,134,255,0.22),_transparent_28%),linear-gradient(180deg,_#f7f9fe_0%,_#edf2ff_40%,_#f7f4ee_100%)] px-4 py-12 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1340px]">
        <header className="mx-auto flex h-16 w-full max-w-[1240px] items-center justify-between rounded-full bg-white/55 px-4 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_18px_40px_rgba(19,34,87,0.08)] ring-1 ring-white/80 backdrop-blur-md sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-0.5 text-slate-950 transition-all duration-200 hover:text-[#3b82f6] hover:[text-shadow:0_0_18px_rgba(59,130,246,0.28)]"
          >
            <Image
              src="/wisedrop-icon.svg"
              alt="Dropwise icon"
              width={26}
              height={26}
              className="h-[26px] w-[26px]"
            />
            <span className="text-[1.05rem] font-semibold tracking-[-0.03em]">
              dropwise
            </span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            <Link
              href="/#core-workflow"
              className="text-[0.95rem] font-medium tracking-[-0.015em] text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:text-slate-950"
            >
              Product
            </Link>
            <Link
              href="/pricing"
              className="text-[0.95rem] font-medium tracking-[-0.015em] text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:text-slate-950"
            >
              Pricing
            </Link>
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
        </header>

        <section className="relative mt-10 overflow-hidden rounded-[2.2rem] border border-slate-200/70 bg-white/72 px-6 py-10 shadow-[0_20px_55px_rgba(15,23,42,0.05)] ring-1 ring-white/80 backdrop-blur-sm sm:px-8 sm:py-12 lg:px-10 lg:py-14">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[6%] top-[12%] h-44 w-44 rounded-full bg-[#60a5fa]/14 blur-3xl" />
            <div className="absolute right-[10%] top-[14%] h-48 w-48 rounded-full bg-[#c084fc]/12 blur-3xl" />
            <div className="absolute left-[42%] bottom-[8%] h-40 w-40 rounded-full bg-[#34d399]/12 blur-3xl" />
          </div>

          <div className="relative max-w-[56rem]">
            <div className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
              Pricing
            </div>
            <h1 className="mt-4 max-w-[13ch] text-[2.35rem] font-semibold leading-[1.02] tracking-[-0.055em] text-slate-950 sm:text-[3.1rem] lg:text-[3.65rem]">
              Start with a couple systems. Expand as routing grows.
            </h1>
            <p className="mt-4 max-w-[48rem] text-[1rem] leading-8 tracking-[-0.02em] text-slate-600 sm:text-[1.08rem]">
              Dropwise pricing scales with the real value of the product:
              how many systems you connect, how complex the routing becomes,
              and how much event traffic flows through the platform.
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-2 2xl:grid-cols-4">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className="overflow-hidden rounded-[2rem] border border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(241,245,255,0.76))] px-6 py-8 shadow-[0_20px_55px_rgba(15,23,42,0.05)] ring-1 ring-white/80 backdrop-blur-sm sm:px-8 sm:py-9"
            >
              <div>
                <div className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
                  {tier.name}
                </div>
                <h2 className="mt-3 text-[1.2rem] font-semibold tracking-[-0.03em] text-slate-950">
                  {tier.summary}
                </h2>
              </div>

              <div className="mt-6 rounded-[1.5rem] bg-white/78 px-5 py-5 ring-1 ring-white/80">
                <div className="text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Price
                </div>
                <div className="mt-3 text-[1.6rem] font-semibold tracking-[-0.04em] text-slate-950">
                  {tier.price}
                </div>
                <p className="mt-3 text-[0.96rem] leading-7 tracking-[-0.02em] text-slate-600">
                  {tier.note}
                </p>
              </div>

              <div className="mt-6 grid gap-3">
                {tier.features.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-start gap-3 rounded-[1.1rem] bg-white/68 px-4 py-3 ring-1 ring-white/80"
                  >
                    <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#60a5fa] shadow-[0_0_18px_rgba(96,165,250,0.4)]" />
                    <div className="text-[0.96rem] leading-7 tracking-[-0.02em] text-slate-700">
                      {feature}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-7">
                <Link
                  href={tier.ctaHref}
                  className="inline-flex h-12 items-center justify-center rounded-full bg-[#3b82f6] px-6 text-[0.96rem] font-semibold tracking-[-0.02em] shadow-[0_12px_28px_rgba(59,130,246,0.28),0_0_26px_rgba(59,130,246,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#2f76ef] hover:shadow-[0_16px_36px_rgba(59,130,246,0.32),0_0_34px_rgba(59,130,246,0.22)]"
                  style={{ color: "#fff" }}
                >
                  {tier.ctaLabel}
                </Link>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white/66 px-6 py-8 shadow-[0_20px_55px_rgba(15,23,42,0.05)] ring-1 ring-white/80 backdrop-blur-sm sm:px-8 sm:py-10">
          <div className="max-w-[44rem]">
            <div className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Compare tiers
            </div>
            <h2 className="mt-3 text-[1.85rem] font-semibold tracking-[-0.045em] text-slate-950">
              Pricing expands with connected systems and event flow.
            </h2>
          </div>

          <div className="mt-6 overflow-hidden rounded-[1.6rem] border border-slate-200/70 bg-white/76">
            {comparisonRows.map((row, index) => (
              <div
                key={row.label}
                className={`grid gap-3 px-4 py-4 lg:grid-cols-[0.8fr_1fr_1fr_1fr_1fr] sm:px-6 ${
                  index > 0 ? "border-t border-slate-200/70" : ""
                }`}
              >
                <div className="text-[0.82rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {row.label}
                </div>
                <div className="text-[0.96rem] leading-7 tracking-[-0.02em] text-slate-700">
                  {row.starter}
                </div>
                <div className="text-[0.96rem] leading-7 tracking-[-0.02em] text-slate-700">
                  {row.growth}
                </div>
                <div className="text-[0.96rem] leading-7 tracking-[-0.02em] text-slate-700">
                  {row.pro}
                </div>
                <div className="text-[0.96rem] leading-7 tracking-[-0.02em] text-slate-700">
                  {row.enterprise}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
