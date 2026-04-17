"use client";

import { useEffect, useMemo, useState } from "react";

import {
  loadFeedEvents,
  feedStatusOptions,
  type FeedEvent,
  type FeedEventStatus,
} from "@/lib/feed";

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

const statusClasses: Record<FeedEventStatus, string> = {
  success: "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-100",
  failed: "bg-rose-500/10 text-rose-700 ring-1 ring-rose-100",
  unmatched: "bg-amber-500/10 text-amber-700 ring-1 ring-amber-100",
  needs_review: "bg-sky-500/10 text-sky-700 ring-1 ring-sky-100",
};

function matchesSearch(event: FeedEvent, search: string) {
  if (!search) {
    return true;
  }

  return [
    event.title,
    event.description,
    event.company,
    event.sourceSystem,
    event.sourceTicketId,
    event.destinationLabel,
    event.routingRule,
    event.board,
    event.ticketStatus,
    event.author,
    event.assignee,
  ]
    .join(" ")
    .toLowerCase()
    .includes(search);
}

export default function FeedPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | FeedEventStatus>("all");
  const [events, setEvents] = useState<FeedEvent[]>([]);
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
        const nextEvents = await loadFeedEvents(tenantId, 50);
        if (!cancelled) {
          setEvents(nextEvents);
          setError(null);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error ? caught.message : "Failed to load feed activity.",
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
  }, []);

  const filteredEvents = useMemo(() => {
    const search = query.trim().toLowerCase();

    return events.filter((event) => {
      const matchesStatus =
        statusFilter === "all" ? true : event.status === statusFilter;

      return matchesStatus && matchesSearch(event, search);
    });
  }, [events, query, statusFilter]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
        <input
          type="search"
          placeholder="Search tickets, rules, companies, destinations, or boards"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-12 rounded-md border border-slate-200/80 bg-white/88 px-4 text-[0.92rem] text-slate-700 outline-none transition focus:border-[#93c5fd] focus:ring-4 focus:ring-[#dbeafe]"
        />

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as "all" | FeedEventStatus)
          }
          className="h-12 rounded-md border border-slate-200/80 bg-white/88 px-4 text-[0.92rem] text-slate-700 outline-none transition focus:border-[#93c5fd] focus:ring-4 focus:ring-[#dbeafe]"
        >
          {feedStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </section>

      <section className="space-y-4">
        {loading ? (
          <div className="rounded-lg border border-slate-200/70 bg-white/88 px-6 py-16 text-center shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
            <h2 className="text-[1.1rem] font-semibold tracking-[-0.03em] text-slate-950">
              Loading activity
            </h2>
            <p className="mt-2 text-[0.92rem] text-slate-600">
              Pulling the latest ConnectWise events into the feed.
            </p>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-rose-200/70 bg-rose-50/85 px-6 py-10 text-center shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
            <h2 className="text-[1.1rem] font-semibold tracking-[-0.03em] text-rose-700">
              Feed unavailable
            </h2>
            <p className="mt-2 text-[0.92rem] text-rose-700/80">{error}</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="rounded-lg border border-slate-200/70 bg-white/88 px-6 py-16 text-center shadow-[0_18px_36px_rgba(15,23,42,0.05)]">
            <h2 className="text-[1.1rem] font-semibold tracking-[-0.03em] text-slate-950">
              No activity matches the current filter
            </h2>
            <p className="mt-2 text-[0.92rem] text-slate-600">
              Broaden the search or switch to a different status to see more feed events.
            </p>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <article
              key={event.id}
              className="rounded-lg border border-slate-200/70 bg-white/88 p-5 shadow-[0_18px_36px_rgba(15,23,42,0.05)] sm:p-6"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-[1.15rem] font-semibold tracking-[-0.03em] text-slate-950">
                      {event.title}
                    </h2>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-[0.74rem] font-semibold uppercase tracking-[0.12em] ${
                        statusClasses[event.status]
                      }`}
                    >
                      {event.status === "needs_review"
                        ? "needs review"
                        : event.status}
                    </span>
                  </div>

                  <p className="mt-2 text-[0.92rem] leading-7 tracking-[-0.015em] text-slate-600">
                    {event.description}
                  </p>
                </div>

                <div className="shrink-0 text-[0.84rem] font-medium tracking-[-0.015em] text-slate-500">
                  {formatTimestamp(event.createdAt)}
                </div>
              </div>

              <div className="mt-5 hidden flex-wrap gap-2 md:flex">
                <InfoPill label="Company" value={event.company} />
                <InfoPill
                  label="Source"
                  value={`${event.sourceSystem} ${event.sourceTicketId}`}
                />
                <InfoPill label="Destination" value={event.destinationLabel} />
                <InfoPill label="Rule" value={event.routingRule} />
                <InfoPill label="Assignee" value={event.assignee} />
                <InfoPill label="Ticket status" value={event.ticketStatus} />
                <InfoPill label="Author" value={event.author} />
              </div>

              <div className="mt-5 space-y-3 md:hidden">
                <MobileInfoRow label="Company" value={event.company} />
                <MobileInfoRow
                  label="Source"
                  value={`${event.sourceSystem} ${event.sourceTicketId}`}
                />
                <MobileInfoRow label="Destination" value={event.destinationLabel} />
                <MobileInfoRow label="Rule" value={event.routingRule} />
                <MobileInfoRow label="Assignee" value={event.assignee} />
                <MobileInfoRow label="Ticket status" value={event.ticketStatus} />
                <MobileInfoRow label="Author" value={event.author} />
              </div>
            </article>
          ))
        )}
      </section>
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
