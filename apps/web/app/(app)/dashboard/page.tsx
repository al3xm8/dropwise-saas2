"use client";

import { useMemo, useState } from "react";

import {
  dashboardData,
  dashboardFilterOptions,
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
};

function clsx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

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
  const snapshot = useMemo(() => dashboardData[timeFilter], [timeFilter]);

  return (
    <div className="space-y-6 2xl:grid 2xl:grid-cols-[minmax(0,1.9fr)_360px] 2xl:gap-6 2xl:space-y-0">
      <div className="space-y-6">
        <section className="rounded-lg border border-slate-200/70 bg-white/88 p-4 shadow-[0_18px_36px_rgba(15,23,42,0.05)] sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Dashboard window
              </p>
              <p className="mt-1 text-[0.92rem] tracking-[-0.02em] text-slate-600">
                Review the current ticket routing snapshot by time range.
              </p>
            </div>

            <div className="inline-flex w-full rounded-lg border border-slate-200/80 bg-slate-50/80 p-1 sm:w-auto">
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

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {snapshot.stats.map((stat, index) => (
            <article
              key={stat.title}
              className="rounded-md border border-slate-200/70 bg-white/88 px-3.5 py-2.5 shadow-[0_12px_24px_rgba(15,23,42,0.04)] xl:min-h-[112px]"
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
            className="rounded-lg border border-slate-200/70 bg-white/88 shadow-[0_18px_36px_rgba(15,23,42,0.05)]"
          >
            <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 px-5 py-5 sm:px-6">
              <div>
                <h2 className="text-[1.35rem] font-semibold tracking-[-0.04em] text-slate-950">
                  Recent Activity
                </h2>
                <p className="mt-1 text-[0.88rem] leading-6 tracking-[-0.015em] text-slate-500">
                  Ticket movement snapshot for the selected dashboard window.
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-200/70 md:hidden">
              {snapshot.activity.map((ticket) => (
                <div key={`${ticket.subject}-${ticket.author}`} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[0.92rem] font-medium tracking-[-0.02em] text-slate-900">
                        {ticket.subject}
                      </p>
                      <p className="mt-1 text-[0.84rem] tracking-[-0.015em] text-slate-500">
                        {ticket.company}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-[0.74rem] font-semibold uppercase tracking-[0.12em] ${
                        activityStatusClasses[ticket.status]
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                      <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Source
                      </dt>
                      <dd className="mt-1 text-[0.84rem] text-slate-600">
                        {ticket.source}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Author
                      </dt>
                      <dd className="mt-1 text-[0.84rem] text-slate-600">
                        {ticket.author}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Destination
                      </dt>
                      <dd className="mt-1 text-[0.84rem] text-slate-600">
                        {ticket.destination}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Assignee
                      </dt>
                      <dd className="mt-1 text-[0.84rem] text-slate-600">
                        {ticket.assignee}
                      </dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/70 bg-slate-50/70">
                    <th className="px-5 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-400 sm:px-6">
                      Ticket subject
                    </th>
                    <th className="px-5 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-400 sm:px-6">
                      Company
                    </th>
                    <th className="px-5 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-400 sm:px-6">
                      Source
                    </th>
                    <th className="px-5 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-400 sm:px-6">
                      Author
                    </th>
                    <th className="px-5 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-400 sm:px-6">
                      Destination
                    </th>
                    <th className="px-5 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-400 sm:px-6">
                      Assignee
                    </th>
                    <th className="px-5 py-3 text-left text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-400 sm:px-6">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.activity.map((ticket) => (
                    <tr
                      key={`${ticket.subject}-${ticket.author}`}
                      className="border-b border-slate-200/70 last:border-b-0"
                    >
                      <td className="px-5 py-4 text-[0.92rem] font-medium tracking-[-0.02em] text-slate-900 sm:px-6">
                        <div className="max-w-[420px] leading-6">
                          {ticket.subject}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[0.88rem] tracking-[-0.015em] text-slate-600 sm:px-6">
                        {ticket.company}
                      </td>
                      <td className="px-5 py-4 text-[0.88rem] tracking-[-0.015em] text-slate-600 sm:px-6">
                        {ticket.source}
                      </td>
                      <td className="px-5 py-4 text-[0.88rem] tracking-[-0.015em] text-slate-600 sm:px-6">
                        {ticket.author}
                      </td>
                      <td className="px-5 py-4 text-[0.88rem] tracking-[-0.015em] text-slate-600 sm:px-6">
                        {ticket.destination}
                      </td>
                      <td className="px-5 py-4 text-[0.88rem] tracking-[-0.015em] text-slate-600 sm:px-6">
                        {ticket.assignee}
                      </td>
                      <td className="px-5 py-4 sm:px-6">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[0.74rem] font-semibold uppercase tracking-[0.12em] ${
                            activityStatusClasses[ticket.status]
                          }`}
                        >
                          {ticket.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      </div>

      <aside className="space-y-6 2xl:sticky 2xl:top-6 2xl:self-start">
        <article className="rounded-lg border border-slate-200/70 bg-white/88 p-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)] sm:p-6">
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
                className="rounded-md border border-slate-200/70 bg-slate-50/60 p-4"
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
          className="rounded-lg border border-slate-200/70 bg-white/88 p-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)] sm:p-6"
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
                  className="flex items-center justify-between rounded-md border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-left text-[0.92rem] font-medium tracking-[-0.02em] text-slate-700 transition hover:border-slate-300 hover:bg-white"
                >
                  <span>{action}</span>
                  <span className="text-slate-400">Soon</span>
                </button>
              ),
            )}
          </div>
        </article>
      </aside>
    </div>
  );
}
