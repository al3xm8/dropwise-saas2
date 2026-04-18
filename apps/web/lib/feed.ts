export type FeedEventStatus =
  | "success"
  | "failed"
  | "unmatched"
  | "needs_review";

export type FeedEvent = {
  id: string;
  createdAt: string;
  title: string;
  description: string;
  company: string;
  sourceSystem: string;
  sourceTicketId: string;
  destinationLabel: string;
  routingRule: string;
  board: string;
  ticketStatus: string;
  author: string;
  assignee: string;
  status: FeedEventStatus;
};

type ActivityEventResponse = {
  eventId?: string;
  createdAt?: string;
  title?: string;
  description?: string;
  ticketSummary?: string;
  company?: string;
  sourceSystem?: string;
  sourceTicketId?: string;
  destinationLabel?: string;
  routingRuleId?: string;
  board?: string;
  ticketStatus?: string;
  contact?: string;
  assignee?: string;
  status?: string;
};

export const feedStatusOptions: Array<{
  value: "all" | FeedEventStatus;
  label: string;
}> = [
  { value: "all", label: "All activity" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
  { value: "unmatched", label: "Unmatched" },
  { value: "needs_review", label: "Needs review" },
];

function apiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }
  return "http://localhost:8080";
}

export async function loadFeedEvents(
  tenantId: string,
  limit = 50,
): Promise<FeedEvent[]> {
  const response = await fetch(
    `${apiBaseUrl()}/api/app/activity/${encodeURIComponent(tenantId)}?limit=${limit}`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to load feed activity.");
  }

  const payload = (await response.json()) as ActivityEventResponse[];
  return payload.map(mapActivityEvent);
}

function mapActivityEvent(event: ActivityEventResponse): FeedEvent {
  const status = normalizeStatus(event.status);
  const ticketId = event.sourceTicketId ?? "Unknown";

  return {
    id: event.eventId ?? `${event.createdAt ?? "unknown"}-${ticketId}`,
    createdAt: event.createdAt ?? "",
    title: event.title ?? event.ticketSummary ?? `ConnectWise ticket ${ticketId}`,
    description: event.description ?? "Recent routing activity.",
    company: event.company ?? "Unknown company",
    sourceSystem: event.sourceSystem ?? "ConnectWise",
    sourceTicketId: ticketId,
    destinationLabel: event.destinationLabel ?? "Pending rule evaluation",
    routingRule: event.routingRuleId ?? "Pending rule evaluation",
    board: event.board ?? "Unknown",
    ticketStatus: event.ticketStatus ?? "Unknown",
    author: event.contact ?? "Unknown contact",
    assignee: event.assignee ?? "Unassigned",
    status,
  };
}

function normalizeStatus(value?: string): FeedEventStatus {
  if (
    value === "success"
    || value === "failed"
    || value === "unmatched"
    || value === "needs_review"
  ) {
    return value;
  }

  return "needs_review";
}
