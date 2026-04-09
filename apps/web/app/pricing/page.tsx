import Link from "next/link";

const starterFeatures = [
  "$49/month base price",
  "Up to 2 users included",
  "User 3: +$30, user 4: +$45, user 5+: +$65 each",
  "1 ticketing source",
  "1 messaging workspace",
  "Up to 2 destination channels",
  "Basic ticket routing into messaging",
  "Guided self-serve setup",
  "Standard async support",
];

const teamFeatures = [
  "Starts at 5 users",
  "Starting around $199/month",
  "Expanded source and workspace coverage",
  "Advanced routing with automatic assignment",
  "Shared admin controls",
  "Onboarding assistance",
  "Priority support",
  "Flat base + user pricing through sales",
];

const comparisonRows = [
  {
    label: "Best for",
    starter: "One operator or a very small setup",
    team: "Broader rollout across a real team",
  },
  {
    label: "Users",
    starter: "Up to 2 included, expandable past 2",
    team: "Starts at 5 with shared deployment",
  },
  {
    label: "Ticketing sources",
    starter: "1 source",
    team: "Expanded source coverage",
  },
  {
    label: "Messaging coverage",
    starter: "1 workspace, up to 2 channels",
    team: "Broader workspace and channel routing",
  },
  {
    label: "Routing",
    starter: "Basic routing into messaging",
    team: "Advanced routing and automatic assignment",
  },
  {
    label: "Buying motion",
    starter: "Self-serve",
    team: "Sales-assisted",
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(122,134,255,0.22),_transparent_28%),linear-gradient(180deg,_#f7f9fe_0%,_#edf2ff_40%,_#f7f4ee_100%)] px-4 py-12 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1240px]">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-[0.9rem] font-medium tracking-[-0.02em] text-slate-600 transition-colors hover:text-slate-950"
          >
            Back to home
          </Link>
          <div className="flex items-center gap-3">
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
        </div>

        <section className="relative mt-10 overflow-hidden rounded-[2.2rem] border border-slate-200/70 bg-white/72 px-6 py-10 shadow-[0_20px_55px_rgba(15,23,42,0.05)] ring-1 ring-white/80 backdrop-blur-sm sm:px-8 sm:py-12 lg:px-10 lg:py-14">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[6%] top-[12%] h-44 w-44 rounded-full bg-[#60a5fa]/14 blur-3xl" />
            <div className="absolute right-[10%] top-[14%] h-48 w-48 rounded-full bg-[#c084fc]/12 blur-3xl" />
            <div className="absolute left-[42%] bottom-[8%] h-40 w-40 rounded-full bg-[#34d399]/12 blur-3xl" />
          </div>

          <div className="relative max-w-[48rem]">
            <div className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
              Pricing
            </div>
            <h1 className="mt-4 max-w-[12ch] text-[2.35rem] font-semibold leading-[1.02] tracking-[-0.055em] text-slate-950 sm:text-[3.1rem] lg:text-[3.65rem]">
              One product, two ways to start.
            </h1>
            <p className="mt-4 max-w-[42rem] text-[1rem] leading-8 tracking-[-0.02em] text-slate-600 sm:text-[1.08rem]">
              Start self-serve with Starter or work with us on a broader Team
              rollout. The product story stays the same. The setup scope and
              support path change with the complexity of your deployment.
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(241,245,255,0.76))] px-6 py-8 shadow-[0_20px_55px_rgba(15,23,42,0.05)] ring-1 ring-white/80 backdrop-blur-sm sm:px-8 sm:py-9">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
                  Starter
                </div>
                <h2 className="mt-3 text-[1.85rem] font-semibold tracking-[-0.045em] text-slate-950">
                  For one operator or a very small setup.
                </h2>
              </div>
              <div className="rounded-full bg-white/80 px-3 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500 ring-1 ring-slate-200/70">
                Self-serve
              </div>
            </div>

            <div className="mt-6 rounded-[1.5rem] bg-white/76 px-5 py-5 ring-1 ring-white/80">
              <div className="text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Pricing
              </div>
              <div className="mt-3 text-[1.35rem] font-semibold tracking-[-0.04em] text-slate-950">
                $49/month for up to 2 users.
              </div>
              <p className="mt-3 text-[0.96rem] leading-7 tracking-[-0.02em] text-slate-600">
                Starter is the path for quick evaluation and small-scale
                adoption. Additional users can be added at +$30, then +$45,
                then +$65 per user, with each extra user beyond 5 staying at
                +$65. By that point, Starter should stop being the sensible
                path.
              </p>
            </div>

            <div className="mt-6 grid gap-3">
              {starterFeatures.map((feature) => (
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

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/signin"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[#3b82f6] px-6 text-[0.96rem] font-semibold tracking-[-0.02em] shadow-[0_12px_28px_rgba(59,130,246,0.28),0_0_26px_rgba(59,130,246,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#2f76ef] hover:shadow-[0_16px_36px_rgba(59,130,246,0.32),0_0_34px_rgba(59,130,246,0.22)]"
                style={{ color: "#fff" }}
              >
                Get started
              </Link>
              <div className="text-[0.9rem] tracking-[-0.02em] text-slate-500">
                Best for evaluation and live setups below the Team threshold.
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-[#60a5fa]/35 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(236,244,255,0.84))] px-6 py-8 shadow-[0_24px_60px_rgba(59,130,246,0.08)] ring-1 ring-white/80 backdrop-blur-sm sm:px-8 sm:py-9">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
                  Team
                </div>
                <h2 className="mt-3 text-[1.85rem] font-semibold tracking-[-0.045em] text-slate-950">
                  For broader rollout, more control, and onboarding help.
                </h2>
              </div>
              <div className="rounded-full bg-white/82 px-3 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#2563eb] ring-1 ring-[#60a5fa]/25">
                Sales-assisted
              </div>
            </div>

            <div className="mt-6 rounded-[1.5rem] bg-white/78 px-5 py-5 ring-1 ring-white/80">
              <div className="text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Pricing
              </div>
              <div className="mt-3 text-[1.35rem] font-semibold tracking-[-0.04em] text-slate-950">
                Starting around $199/month at 5 users.
              </div>
              <p className="mt-3 text-[0.96rem] leading-7 tracking-[-0.02em] text-slate-600">
                Team is the right path once deployment reaches 5 users or
                needs broader routing, shared administration, and rollout
                support. It should become the better-value option once a
                customer reaches the 5-user crossover.
              </p>
            </div>

            <div className="mt-6 grid gap-3">
              {teamFeatures.map((feature) => (
                <div
                  key={feature}
                  className="flex items-start gap-3 rounded-[1.1rem] bg-white/68 px-4 py-3 ring-1 ring-white/80"
                >
                  <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#34d399] shadow-[0_0_18px_rgba(52,211,153,0.4)]" />
                  <div className="text-[0.96rem] leading-7 tracking-[-0.02em] text-slate-700">
                    {feature}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/contact-sales"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[#3b82f6] px-6 text-[0.96rem] font-semibold tracking-[-0.02em] shadow-[0_12px_28px_rgba(59,130,246,0.28),0_0_26px_rgba(59,130,246,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#2f76ef] hover:shadow-[0_16px_36px_rgba(59,130,246,0.32),0_0_34px_rgba(59,130,246,0.22)]"
                style={{ color: "#fff" }}
              >
                Contact sales
              </Link>
              <div className="text-[0.9rem] tracking-[-0.02em] text-slate-500">
                Best for 5+ user deployment and rollout planning.
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white/66 px-6 py-8 shadow-[0_20px_55px_rgba(15,23,42,0.05)] ring-1 ring-white/80 backdrop-blur-sm sm:px-8 sm:py-10">
          <div className="max-w-[40rem]">
            <div className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Compare the paths
            </div>
            <h2 className="mt-3 text-[1.85rem] font-semibold tracking-[-0.045em] text-slate-950">
              Choose the path that matches the scope of your rollout.
            </h2>
          </div>

          <div className="mt-6 overflow-hidden rounded-[1.6rem] border border-slate-200/70 bg-white/76">
            {comparisonRows.map((row, index) => (
              <div
                key={row.label}
                className={`grid gap-3 px-4 py-4 sm:grid-cols-[0.8fr_1fr_1fr] sm:px-6 ${
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
                  {row.team}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
