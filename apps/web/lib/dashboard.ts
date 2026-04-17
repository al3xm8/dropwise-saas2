import {
  loadFeedEvents,
  type FeedEventStatus,
  type FeedEvent,
} from "@/lib/feed";

export type DashboardTimeFilter = "24h" | "7d" | "30d" | "all";

export type DashboardStat = {
  title: string;
  value: string;
  detail: string;
};

export type DashboardActivityStatus = FeedEventStatus;

export type DashboardActivityItem = {
  id: string;
  createdAt: string;
  subject: string;
  description: string;
  company: string;
  source: string;
  sourceTicketId: string;
  destination: string;
  routingRule: string;
  ticketStatus: string;
  author: string;
  assignee: string;
  status: DashboardActivityStatus;
};

export type DashboardSystemStatus =
  | "Operational"
  | "Attention needed"
  | "Coming next";

export type DashboardSystemItem = {
  name: string;
  status: DashboardSystemStatus;
  detail: string;
};

export type DashboardSnapshot = {
  stats: DashboardStat[];
  activity: DashboardActivityItem[];
  systems: DashboardSystemItem[];
};

type TenantConfigResponse = {
  connectwiseConnected?: boolean;
  slackConnected?: boolean;
  botInvited?: boolean;
};

const MAX_DASHBOARD_EVENTS = 500;

export const dashboardFilterOptions: DashboardTimeFilter[] = [
  "24h",
  "7d",
  "30d",
  "all",
];

function apiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }
  return "http://localhost:8080";
}

function filterStartDate(filter: DashboardTimeFilter) {
  if (filter === "all") {
    return null;
  }

  const start = new Date();
  if (filter === "24h") {
    start.setHours(start.getHours() - 24);
  } else if (filter === "7d") {
    start.setDate(start.getDate() - 7);
  } else {
    start.setDate(start.getDate() - 30);
  }
  return start;
}

function eventTimestamp(value: string) {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function filterEventsByWindow(events: FeedEvent[], filter: DashboardTimeFilter) {
  const start = filterStartDate(filter);
  if (!start) {
    return events;
  }

  const startTime = start.getTime();
  return events.filter((event) => eventTimestamp(event.createdAt) >= startTime);
}

function latestEventsByTicket(events: FeedEvent[]) {
  const grouped = new Map<string, FeedEvent>();

  for (const event of events) {
    const ticketKey = `${event.sourceSystem}:${event.sourceTicketId}`;
    const existing = grouped.get(ticketKey);
    if (!existing || eventTimestamp(event.createdAt) >= eventTimestamp(existing.createdAt)) {
      grouped.set(ticketKey, event);
    }
  }

  return [...grouped.values()].sort(
    (left, right) => eventTimestamp(right.createdAt) - eventTimestamp(left.createdAt),
  );
}

function countByStatus(events: FeedEvent[]) {
  return {
    success: events.filter((event) => event.status === "success").length,
    failed: events.filter((event) => event.status === "failed").length,
    unmatched: events.filter((event) => event.status === "unmatched").length,
    needsReview: events.filter((event) => event.status === "needs_review").length,
  };
}

function topDestination(events: FeedEvent[]) {
  const counts = new Map<string, number>();

  for (const event of events) {
    if (!event.destinationLabel || event.destinationLabel === "Pending rule evaluation") {
      continue;
    }

    counts.set(event.destinationLabel, (counts.get(event.destinationLabel) ?? 0) + 1);
  }

  let winner = "Pending rule evaluation";
  let max = 0;

  for (const [destination, count] of counts.entries()) {
    if (count > max) {
      winner = destination;
      max = count;
    }
  }

  return winner;
}

function distinctRulesSeen(events: FeedEvent[]) {
  return new Set(
    events
      .map((event) => event.routingRule)
      .filter((value) => value && value !== "Pending rule evaluation"),
  ).size;
}

function formatPassingRate(successCount: number, failedCount: number, unmatchedCount: number) {
  const totalEvaluated = successCount + failedCount + unmatchedCount;
  if (totalEvaluated === 0) {
    return "0%";
  }

  return `${Math.round((successCount / totalEvaluated) * 100)}%`;
}

function buildStats(
  latestEvents: FeedEvent[],
  tenantConfig: TenantConfigResponse | null,
): DashboardStat[] {
  const counts = countByStatus(latestEvents);
  const integrationCount = Number(Boolean(tenantConfig?.connectwiseConnected))
    + Number(Boolean(tenantConfig?.slackConnected));
  const routedCount = counts.success;
  const topRoute = topDestination(latestEvents);
  const rulesSeen = distinctRulesSeen(latestEvents);

  return [
    {
      title: "Rules Seen",
      value: String(rulesSeen),
      detail: "Distinct routing rules observed in live ticket activity for this window.",
    },
    {
      title: "Active Integrations",
      value: String(integrationCount),
      detail: "Connected integrations currently available for this workspace.",
    },
    {
      title: "Tickets Routed",
      value: String(routedCount),
      detail: "Tickets whose latest live event ended in a successful route.",
    },
    {
      title: "Unmatched Tickets",
      value: String(counts.unmatched),
      detail: "Tickets whose latest live event has no matching route.",
    },
    {
      title: "Rules Passing",
      value: formatPassingRate(counts.success, counts.failed, counts.unmatched),
      detail: "Share of latest live ticket outcomes that ended in a successful route.",
    },
    {
      title: "Failed Tickets",
      value: String(counts.failed),
      detail: "Tickets whose latest live event failed during routing or delivery.",
    },
    {
      title: "Needs Response",
      value: String(counts.needsReview),
      detail: "Tickets whose latest live event is still waiting on follow-up or review.",
    },
    {
      title: "Top Destination",
      value: topRoute,
      detail: "Most-used destination across the latest live ticket outcomes in this window.",
    },
  ];
}

function buildActivity(latestEvents: FeedEvent[]): DashboardActivityItem[] {
  return latestEvents.slice(0, 5).map((event) => ({
    id: event.id,
    createdAt: event.createdAt,
    subject: event.title,
    description: event.description,
    company: event.company,
    source: event.sourceSystem,
    sourceTicketId: event.sourceTicketId,
    destination: event.destinationLabel,
    routingRule: event.routingRule,
    ticketStatus: event.ticketStatus,
    author: event.author,
    assignee: event.assignee,
    status: event.status,
  }));
}

function buildSystems(
  latestEvents: FeedEvent[],
  tenantConfig: TenantConfigResponse | null,
): DashboardSystemItem[] {
  const counts = countByStatus(latestEvents);

  return [
    {
      name: "ConnectWise",
      status: tenantConfig?.connectwiseConnected ? "Operational" : "Attention needed",
      detail: tenantConfig?.connectwiseConnected
        ? `Live ticket intake is connected with ${latestEvents.length} ticket snapshots in the selected window.`
        : "ConnectWise is not fully connected for this workspace.",
    },
    {
      name: "Slack",
      status:
        tenantConfig?.slackConnected && tenantConfig?.botInvited
          ? counts.failed > 0
            ? "Attention needed"
            : "Operational"
          : "Attention needed",
      detail:
        tenantConfig?.slackConnected && tenantConfig?.botInvited
          ? counts.failed > 0
            ? `${counts.failed} tickets currently show failed delivery outcomes.`
            : "Slack delivery is connected and no failed ticket outcomes are showing in this window."
          : "Slack is not fully connected or the bot has not been invited yet.",
    },
    {
      name: "Feed",
      status: counts.failed > 0 || counts.unmatched > 0 ? "Attention needed" : "Operational",
      detail:
        counts.failed > 0 || counts.unmatched > 0
          ? `${counts.unmatched} unmatched tickets and ${counts.failed} failed tickets currently need review.`
          : "Feed is reflecting current live ticket activity without unmatched or failed outcomes in this window.",
    },
  ];
}

async function loadTenantConfig(tenantId: string): Promise<TenantConfigResponse | null> {
  const response = await fetch(
    `${apiBaseUrl()}/api/app/tenant-config/${encodeURIComponent(tenantId)}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as TenantConfigResponse;
}

export async function loadDashboardSnapshot(
  tenantId: string,
  filter: DashboardTimeFilter,
): Promise<DashboardSnapshot> {
  const [events, tenantConfig] = await Promise.all([
    loadFeedEvents(tenantId, MAX_DASHBOARD_EVENTS),
    loadTenantConfig(tenantId),
  ]);

  const windowEvents = filterEventsByWindow(events, filter);
  const latestEvents = latestEventsByTicket(windowEvents);

  return {
    stats: buildStats(latestEvents, tenantConfig),
    activity: buildActivity(latestEvents),
    systems: buildSystems(latestEvents, tenantConfig),
  };
}
