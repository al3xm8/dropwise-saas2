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

export const feedEvents: FeedEvent[] = [
  {
    id: "evt-2026-04-16-001",
    createdAt: "2026-04-16T09:42:00-04:00",
    title: "Accounting workstation cannot authenticate to VPN",
    description:
      "Matched the priority routing path and delivered the ticket into the service priority queue.",
    company: "Northfield Dental Group",
    sourceSystem: "ConnectWise",
    sourceTicketId: "CW-10482",
    destinationLabel: "#service-priority",
    routingRule: "Urgent Service Coverage",
    board: "Service",
    ticketStatus: "New",
    author: "Sonia Kim",
    assignee: "Chris Nolan",
    status: "success",
  },
  {
    id: "evt-2026-04-16-002",
    createdAt: "2026-04-16T09:21:00-04:00",
    title: "Vendor invoice email blocked by quarantine policy",
    description:
      "No active rule matched this ticket, so it was held out of delivery and surfaced for review.",
    company: "Maple Ridge Architects",
    sourceSystem: "ConnectWise",
    sourceTicketId: "CW-10479",
    destinationLabel: "No matching route",
    routingRule: "No rule matched",
    board: "Service",
    ticketStatus: "New",
    author: "Nina Alvarez",
    assignee: "Unassigned",
    status: "unmatched",
  },
  {
    id: "evt-2026-04-16-003",
    createdAt: "2026-04-16T08:58:00-04:00",
    title: "After-hours internet outage update for branch office",
    description:
      "Matched the after-hours path, but the destination post failed and needs operator follow-up.",
    company: "BrightPath Clinics",
    sourceSystem: "ConnectWise",
    sourceTicketId: "CW-10476",
    destinationLabel: "#after-hours",
    routingRule: "After Hours Fallback",
    board: "Network",
    ticketStatus: "Escalated",
    author: "Marcus Lee",
    assignee: "Tori Nguyen",
    status: "failed",
  },
  {
    id: "evt-2026-04-16-004",
    createdAt: "2026-04-16T08:31:00-04:00",
    title: "New user cannot sign in after Microsoft 365 password reset",
    description:
      "Delivered into identity access, but the ticket is still waiting on a technician response.",
    company: "Crestline Logistics",
    sourceSystem: "ConnectWise",
    sourceTicketId: "CW-10472",
    destinationLabel: "#identity-access",
    routingRule: "Identity Access Intake",
    board: "Service",
    ticketStatus: "Waiting on technician",
    author: "Lauren Cruz",
    assignee: "Unassigned",
    status: "needs_review",
  },
  {
    id: "evt-2026-04-16-005",
    createdAt: "2026-04-16T08:07:00-04:00",
    title: "Recurring print spooler failure on AP workstation",
    description:
      "Matched the service priority rule and posted successfully to the assigned destination.",
    company: "Pine Harbor Advisory",
    sourceSystem: "ConnectWise",
    sourceTicketId: "CW-10469",
    destinationLabel: "#service-priority",
    routingRule: "Urgent Service Coverage",
    board: "Service",
    ticketStatus: "Assigned",
    author: "Ethan Brooks",
    assignee: "Drew Patel",
    status: "success",
  },
  {
    id: "evt-2026-04-16-006",
    createdAt: "2026-04-16T07:48:00-04:00",
    title: "Voicemail-to-email delivery delayed for front office queue",
    description:
      "Communications support route posted correctly, but the ticket still needs a response from the assigned tech.",
    company: "Harbor West Advisors",
    sourceSystem: "ConnectWise",
    sourceTicketId: "CW-10466",
    destinationLabel: "#communications-support",
    routingRule: "Front Office Communication Issues",
    board: "Communications",
    ticketStatus: "Waiting on technician",
    author: "Eric Foster",
    assignee: "Maya Chen",
    status: "needs_review",
  },
  {
    id: "evt-2026-04-16-007",
    createdAt: "2026-04-16T07:22:00-04:00",
    title: "Conference room display drops signal after dock wake",
    description:
      "Standard dispatch route evaluated cleanly and delivered the ticket to the dispatch channel.",
    company: "Willow Creek Legal",
    sourceSystem: "ConnectWise",
    sourceTicketId: "CW-10461",
    destinationLabel: "#service-dispatch",
    routingRule: "General Dispatch Coverage",
    board: "Projects",
    ticketStatus: "Assigned",
    author: "Kayla Simmons",
    assignee: "Drew Patel",
    status: "success",
  },
  {
    id: "evt-2026-04-16-008",
    createdAt: "2026-04-16T06:54:00-04:00",
    title: "Guest Wi-Fi outage reported by front desk manager",
    description:
      "Ticket landed without a usable route because the current board and site combination is not covered.",
    company: "Summit Hospitality Group",
    sourceSystem: "ConnectWise",
    sourceTicketId: "CW-10458",
    destinationLabel: "No matching route",
    routingRule: "No rule matched",
    board: "Network",
    ticketStatus: "New",
    author: "Paige Romero",
    assignee: "Unassigned",
    status: "unmatched",
  },
];
