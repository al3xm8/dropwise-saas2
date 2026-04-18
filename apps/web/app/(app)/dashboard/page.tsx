"use client";

import { useEffect, useMemo, useState } from "react";

import {
  dashboardFilterOptions,
  loadDashboardSnapshot,
  type DashboardSnapshot,
  type DashboardActivityStatus,
  type DashboardSystemStatus,
  type DashboardTimeFilter,
} from "@/lib/dashboard";

const systemStatusClasses: Record<DashboardSystemStatus, string> = {
  Operational: "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-100",
  "Attention needed":
    "bg-amber-500/10 text-amber-700 ring-1 ring-amber-100",
  "Coming next": "bg-slate-500/10 text-slate-600 ring-1 ring-slate-200",
};

const activityStatusClasses: Record<DashboardActivityStatus, string> = {
  success: "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-100",
  failed: "bg-rose-500/10 text-rose-700 ring-1 ring-rose-100",
  unmatched: "bg-amber-500/10 text-amber-700 ring-1 ring-amber-100",
  needs_review: "bg-sky-500/10 text-sky-700 ring-1 ring-sky-100",
};

function clsx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

const emptySnapshot: DashboardSnapshot = {
  stats: [],
  activity: [],
  systems: [],
};

function CardHelp({
  title,
  detail,
  isOpen,
  onToggle,
  align = "left",
}: {
  title: string;
  detail: string;
  isOpen: boolean;
  onToggle: () => void;
  align?: "left" | "right";
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-label={`Help for ${title}`}
        aria-expanded={isOpen}
        className="inline-flex h-3 w-3 items-center justify-center rounded-full border border-slate-300/80 bg-white/90 text-[0.45rem] font-semibold text-slate-500 shadow-[0_4px_10px_rgba(148,163,184,0.10)] transition-colors hover:bg-slate-50 hover:text-slate-700"
      >
        ?
      </button>

      {isOpen ? (
        <div
          className={clsx(
            "absolute top-6 z-40 w-[min(17rem,calc(100vw-4rem))] rounded-lg border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(244,247,255,0.92))] p-4 text-left shadow-[0_22px_48px_rgba(15,23,42,0.10)] ring-1 ring-white/80 backdrop-blur-sm",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
            {title}
          </div>
          <p className="mt-3 text-[0.88rem] leading-6 tracking-[-0.02em] text-slate-700">
            {detail}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export default function DashboardPage() {
  const [timeFilter, setTimeFilter] = useState<DashboardTimeFilter>("7d");
  const [openCardHelpId, setOpenCardHelpId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>(emptySnapshot);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedTenantId = window.localStorage.getItem("dropwiseTenantId");
    if (!storedTenantId) {
      setError("No tenant is available yet for this workspace.");
      setLoading(false);
      return;
    }
    const tenantId = storedTenantId;

    let cancelled = false;

    async function refresh() {
      try {
        setLoading(true);
        const nextSnapshot = await loadDashboardSnapshot(tenantId, timeFilter);
        if (!cancelled) {
          setSnapshot(nextSnapshot);
          setError(null);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error ? caught.message : "Failed to load dashboard activity.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void refresh();

    return () => {
      cancelled = true;
    };
  }, [timeFilter]);

  const hasData = useMemo(
    () => snapshot.stats.length > 0 || snapshot.activity.length > 0 || snapshot.systems.length > 0,
    [snapshot],
  );

  return (
    <div className="space-y-6 2xl:grid 2xl:grid-cols-[minmax(0,1.9fr)_360px] 2xl:gap-6 2xl:space-y-0">
      <div className="space-y-6">
        <section className="rounded-md border border-slate-400/85 bg-white/92 p-4 shadow-[0_16px_34px_rgba(15,23,42,0.06)] sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Dashboard window
              </p>
              <p className="mt-1 text-[0.92rem] tracking-[-0.02em] text-slate-600">
                Review the current ticket routing snapshot by time range.
              </p>
            </div>

            <div className="inline-flex w-full rounded-lg border border-slate-300/85 bg-slate-50/82 p-1 sm:w-auto">
              {dashboardFilterOptions.map((option) => {
                const active = option === timeFilter;

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setTimeFilter(option)}
                    className={`flex-1 rounded-md px-4 py-2 text-[0.88rem] font-medium tracking-[-0.02em] transition-colors sm:flex-none ${
                      active
                        ? "bg-white text-slate-950 shadow-[0_1px_2px_rgba(15,23,42,0.08)]"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {option === "all" ? "All time" : option}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {loading ? (
          <section className="rounded-md border border-slate-400/85 bg-white/92 px-6 py-16 text-center shadow-[0_16px_34px_rgba(15,23,42,0.06)]">
            <h2 className="text-[1.1rem] font-semibold tracking-[-0.03em] text-slate-950">
              Loading dashboard
            </h2>
            <p className="mt-2 text-[0.92rem] text-slate-600">
              Pulling live ticket activity and integration state into the dashboard.
            </p>
          </section>
        ) : error ? (
          <section className="rounded-md border border-rose-400/75 bg-rose-50/92 px-6 py-10 text-center shadow-[0_16px_34px_rgba(15,23,42,0.06)]">
            <h2 className="text-[1.1rem] font-semibold tracking-[-0.03em] text-rose-700">
              Dashboard unavailable
            </h2>
            <p className="mt-2 text-[0.92rem] text-rose-700/80">{error}</p>
          </section>
        ) : !hasData ? (
          <section className="rounded-md border border-slate-400/85 bg-white/92 px-6 py-16 text-center shadow-[0_16px_34px_rgba(15,23,42,0.06)]">
            <h2 className="text-[1.1rem] font-semibold tracking-[-0.03em] text-slate-950">
              No live dashboard data yet
            </h2>
            <p className="mt-2 text-[0.92rem] text-slate-600">
              Ticket activity will appear here once ConnectWise events start landing for this workspace.
            </p>
          </section>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {snapshot.stats.map((stat, index) => (
                <article
                  key={stat.title}
                  className="rounded-md border border-slate-400/80 bg-white/94 px-3.5 py-2.5 shadow-[0_12px_24px_rgba(15,23,42,0.05)] xl:min-h-[112px]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[0.8rem] font-medium tracking-[-0.015em] text-slate-500">
                      {stat.title}
                    </p>
                    <CardHelp
                      title={stat.title}
                      detail={stat.detail}
                      isOpen={openCardHelpId === stat.title}
                      onToggle={() =>
                        setOpenCardHelpId((current) =>
                          current === stat.title ? null : stat.title,
                        )
                      }
                      align={index % 4 >= 2 ? "right" : "left"}
                    />
                  </div>
                  <p className="mt-2.5 text-[1.65rem] font-semibold leading-none tracking-[-0.045em] text-slate-950">
                    {stat.value}
                  </p>
                </article>
              ))}
            </section>

            <section>
              <article
                id="recent-activity"
                className="rounded-md border border-slate-400/85 bg-white/92 shadow-[0_16px_34px_rgba(15,23,42,0.06)]"
              >
                <div className="flex items-center justify-between gap-4 border-b border-slate-300/80 px-5 py-5 sm:px-6">
                  <div>
                    <h2 className="text-[1.35rem] font-semibold tracking-[-0.04em] text-slate-950">
                      Recent Activity
                    </h2>
                    <p className="mt-1 text-[0.88rem] leading-6 tracking-[-0.015em] text-slate-500">
                      Ticket movement snapshot for the selected dashboard window.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 px-5 py-5 sm:px-6">
                  {snapshot.activity.map((ticket) => (
                    <article
                      key={ticket.id}
                      className="rounded-md border border-slate-400/80 bg-white/96 p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)]"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-[1.05rem] font-semibold tracking-[-0.03em] text-slate-950">
                              {ticket.subject}
                            </h3>
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-[0.74rem] font-semibold uppercase tracking-[0.12em] ${
                                activityStatusClasses[ticket.status]
                              }`}
                            >
                              {ticket.status === "needs_review"
                                ? "needs review"
                                : ticket.status}
                            </span>
                          </div>

                          <p className="mt-2 text-[0.92rem] leading-7 tracking-[-0.015em] text-slate-600">
                            {ticket.description}
                          </p>
                        </div>

                        <div className="shrink-0 text-[0.84rem] font-medium tracking-[-0.015em] text-slate-500">
                          {formatTimestamp(ticket.createdAt)}
                        </div>
                      </div>

                      <div className="mt-5 hidden flex-wrap gap-2 md:flex">
                        <InfoPill label="Company" value={ticket.company} />
                        <InfoPill
                          label="Source"
                          value={`${ticket.source} ${ticket.sourceTicketId}`}
                        />
                        <InfoPill label="Destination" value={ticket.destination} />
                        <InfoPill label="Rule" value={ticket.routingRule} />
                        <InfoPill label="Assignee" value={ticket.assignee} />
                        <InfoPill label="Ticket status" value={ticket.ticketStatus} />
                        <InfoPill label="Author" value={ticket.author} />
                      </div>

                      <div className="mt-5 space-y-3 md:hidden">
                        <MobileInfoRow label="Company" value={ticket.company} />
                        <MobileInfoRow
                          label="Source"
                          value={`${ticket.source} ${ticket.sourceTicketId}`}
                        />
                        <MobileInfoRow label="Destination" value={ticket.destination} />
                        <MobileInfoRow label="Rule" value={ticket.routingRule} />
                        <MobileInfoRow label="Assignee" value={ticket.assignee} />
                        <MobileInfoRow label="Ticket status" value={ticket.ticketStatus} />
                        <MobileInfoRow label="Author" value={ticket.author} />
                      </div>
                    </article>
                  ))}
                </div>
              </article>
            </section>
          </>
        )}
      </div>

      {!loading && !error && hasData ? (
        <aside className="space-y-6 2xl:sticky 2xl:top-6 2xl:self-start">
        <article className="rounded-md border border-slate-400/85 bg-white/92 p-5 shadow-[0_16px_34px_rgba(15,23,42,0.06)] sm:p-6">
          <h2 className="text-[1.35rem] font-semibold tracking-[-0.04em] text-slate-950">
            System Health
          </h2>
          <p className="mt-1 text-[0.88rem] leading-6 tracking-[-0.015em] text-slate-500">
            Current status of connected systems and routing coverage.
          </p>

          <div className="mt-6 space-y-4">
            {snapshot.systems.map((system) => (
              <div
                key={system.name}
                className="rounded-md border border-slate-400/75 bg-slate-50/78 p-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <span className="min-w-0 font-medium tracking-[-0.02em] text-slate-900">
                      {system.name}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-[0.74rem] font-semibold uppercase tracking-[0.12em] ${
                        systemStatusClasses[system.status]
                      }`}
                    >
                      {system.status}
                    </span>
                  </div>
                  <p className="mt-2 text-[0.84rem] leading-6 tracking-[-0.015em] text-slate-600">
                    {system.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article
          id="quick-actions"
          className="rounded-md border border-slate-400/85 bg-white/92 p-5 shadow-[0_16px_34px_rgba(15,23,42,0.06)] sm:p-6"
        >
          <h2 className="text-[1.35rem] font-semibold tracking-[-0.04em] text-slate-950">
            Quick Actions
          </h2>
          <p className="mt-1 text-[0.88rem] leading-6 tracking-[-0.015em] text-slate-500">
            Most likely next moves from the dashboard.
          </p>

          <div className="mt-5 flex flex-col gap-3">
            {["Re-run onboarding", "Manage integrations", "Edit routing rules"].map(
              (action) => (
                <button
                  key={action}
                  type="button"
                  className="flex items-center justify-between rounded-md border border-slate-400/75 bg-slate-50/78 px-4 py-3 text-left text-[0.92rem] font-medium tracking-[-0.02em] text-slate-700 transition hover:border-slate-500 hover:bg-white"
                >
                  <span>{action}</span>
                  <span className="text-slate-400">Soon</span>
                </button>
              ),
            )}
          </div>
        </article>
        </aside>
      ) : null}
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50/75 px-3 py-1.5">
      <span className="shrink-0 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </span>
      <span className="max-w-[220px] truncate text-[0.84rem] tracking-[-0.015em] text-slate-700">
        {value}
      </span>
    </div>
  );
}

function MobileInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-200/70 pb-3 last:border-b-0 last:pb-0">
      <span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </span>
      <span className="max-w-[65%] text-right text-[0.88rem] leading-6 tracking-[-0.015em] text-slate-700">
        {value}
      </span>
    </div>
  );
}
