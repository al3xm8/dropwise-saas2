export type DashboardTimeFilter = "24h" | "7d" | "30d" | "all";

export type DashboardStat = {
  title: string;
  value: string;
  detail: string;
};

export type DashboardActivityStatus = "success" | "failed" | "unmatched";

export type DashboardActivityItem = {
  subject: string;
  company: string;
  source: string;
  destination: string;
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

export const dashboardFilterOptions: DashboardTimeFilter[] = [
  "24h",
  "7d",
  "30d",
  "all",
];

export const dashboardData: Record<DashboardTimeFilter, DashboardSnapshot> = {
  "24h": {
    stats: [
      {
        title: "Total Rules",
        value: "12",
        detail: "Active routing rules currently evaluating inbound ticket traffic.",
      },
      {
        title: "Active Integrations",
        value: "2",
        detail: "ConnectWise and Slack are both connected for this workspace.",
      },
      {
        title: "Tickets Routed",
        value: "38",
        detail: "Tickets delivered into active destinations during the last 24 hours.",
      },
      {
        title: "Unmatched Tickets",
        value: "4",
        detail: "Tickets that entered without a matching route and need follow-up.",
      },
      {
        title: "Rules Passing",
        value: "91%",
        detail: "Rule evaluations that ended in a clean delivery without exceptions.",
      },
      {
        title: "Failed Tickets",
        value: "3",
        detail: "Tickets that matched a route but did not post cleanly to the destination.",
      },
      {
        title: "Needs Response",
        value: "11",
        detail: "Open routed tickets still waiting on a technician response.",
      },
      {
        title: "Top Destination",
        value: "#service-priority",
        detail: "Most-used destination for routed tickets in the selected window.",
      },
    ],
    activity: [
      {
        subject: "Accounting workstation cannot authenticate to VPN",
        company: "Northfield Dental Group",
        source: "ConnectWise",
        destination: "#service-priority",
        author: "Sonia Kim",
        assignee: "Chris Nolan",
        status: "success",
      },
      {
        subject: "New user cannot sign in after Microsoft 365 password reset",
        company: "Crestline Logistics",
        source: "ConnectWise",
        destination: "#identity-access",
        author: "Lauren Cruz",
        assignee: "Unassigned",
        status: "success",
      },
      {
        subject: "Recurring print spooler failure on AP workstation",
        company: "Pine Harbor Advisory",
        source: "ConnectWise",
        destination: "#service-priority",
        author: "Ethan Brooks",
        assignee: "Drew Patel",
        status: "success",
      },
      {
        subject: "Vendor invoice email blocked by quarantine policy",
        company: "Maple Ridge Architects",
        source: "ConnectWise",
        destination: "No matching route",
        author: "Nina Alvarez",
        assignee: "Unassigned",
        status: "unmatched",
      },
      {
        subject: "After-hours internet outage update for branch office",
        company: "BrightPath Clinics",
        source: "ConnectWise",
        destination: "#after-hours",
        author: "Marcus Lee",
        assignee: "Tori Nguyen",
        status: "failed",
      },
    ],
    systems: [
      {
        name: "ConnectWise",
        status: "Operational",
        detail: "Inbound sync is current and ticket updates are arriving normally.",
      },
      {
        name: "Slack",
        status: "Operational",
        detail: "Destination posting is healthy aside from three delivery exceptions.",
      },
      {
        name: "Feed",
        status: "Attention needed",
        detail: "Four unmatched tickets and three failed deliveries need review.",
      },
    ],
  },
  "7d": {
    stats: [
      {
        title: "Total Rules",
        value: "12",
        detail: "Active routing rules currently evaluating inbound ticket traffic.",
      },
      {
        title: "Active Integrations",
        value: "2",
        detail: "ConnectWise and Slack are both connected for this workspace.",
      },
      {
        title: "Tickets Routed",
        value: "214",
        detail: "Tickets delivered into active destinations over the last 7 days.",
      },
      {
        title: "Unmatched Tickets",
        value: "16",
        detail: "Tickets that entered without a matching route and need follow-up.",
      },
      {
        title: "Rules Passing",
        value: "94%",
        detail: "Rule evaluations that ended in a clean delivery without exceptions.",
      },
      {
        title: "Failed Tickets",
        value: "12",
        detail: "Tickets that matched a route but did not post cleanly to the destination.",
      },
      {
        title: "Needs Response",
        value: "29",
        detail: "Open routed tickets still waiting on a technician response.",
      },
      {
        title: "Top Destination",
        value: "#service-dispatch",
        detail: "Most-used destination for routed tickets in the selected window.",
      },
    ],
    activity: [
      {
        subject: "Office manager cannot access payroll share after VPN reconnect",
        company: "Lakeview Manufacturing",
        source: "ConnectWise",
        destination: "#service-priority",
        author: "Jamie Torres",
        assignee: "Chris Nolan",
        status: "success",
      },
      {
        subject: "Conference room display drops signal after dock wake",
        company: "Willow Creek Legal",
        source: "ConnectWise",
        destination: "#service-dispatch",
        author: "Kayla Simmons",
        assignee: "Drew Patel",
        status: "success",
      },
      {
        subject: "Voicemail-to-email delivery delayed for front office queue",
        company: "Harbor West Advisors",
        source: "ConnectWise",
        destination: "#communications-support",
        author: "Eric Foster",
        assignee: "Maya Chen",
        status: "success",
      },
      {
        subject: "Guest Wi-Fi outage reported by front desk manager",
        company: "Summit Hospitality Group",
        source: "ConnectWise",
        destination: "No matching route",
        author: "Paige Romero",
        assignee: "Unassigned",
        status: "unmatched",
      },
      {
        subject: "Warehouse scanner station losing mapped drives after reconnect",
        company: "Redstone Distribution",
        source: "ConnectWise",
        destination: "#service-dispatch",
        author: "Brandon White",
        assignee: "Tori Nguyen",
        status: "failed",
      },
    ],
    systems: [
      {
        name: "ConnectWise",
        status: "Operational",
        detail: "Inbound sync is current and board updates are landing normally.",
      },
      {
        name: "Slack",
        status: "Operational",
        detail: "Destination posting is stable with a small number of retried failures.",
      },
      {
        name: "Feed",
        status: "Attention needed",
        detail: "Sixteen unmatched tickets and twelve delivery failures still need review.",
      },
    ],
  },
  "30d": {
    stats: [
      {
        title: "Total Rules",
        value: "12",
        detail: "Active routing rules currently evaluating inbound ticket traffic.",
      },
      {
        title: "Active Integrations",
        value: "2",
        detail: "ConnectWise and Slack are both connected for this workspace.",
      },
      {
        title: "Tickets Routed",
        value: "892",
        detail: "Tickets delivered into active destinations over the last 30 days.",
      },
      {
        title: "Unmatched Tickets",
        value: "43",
        detail: "Tickets that entered without a matching route and need follow-up.",
      },
      {
        title: "Rules Passing",
        value: "95%",
        detail: "Rule evaluations that ended in a clean delivery without exceptions.",
      },
      {
        title: "Failed Tickets",
        value: "27",
        detail: "Tickets that matched a route but did not post cleanly to the destination.",
      },
      {
        title: "Needs Response",
        value: "76",
        detail: "Open routed tickets still waiting on a technician response.",
      },
      {
        title: "Top Destination",
        value: "#service-dispatch",
        detail: "Most-used destination for routed tickets in the selected window.",
      },
    ],
    activity: [
      {
        subject: "Vendor portal MFA lockout for controller workstation",
        company: "Oakline Pediatrics",
        source: "ConnectWise",
        destination: "#identity-access",
        author: "Sofia Ramirez",
        assignee: "Maya Chen",
        status: "success",
      },
      {
        subject: "Remote user cannot reach line-of-business app over VPN",
        company: "Northbridge Supply",
        source: "ConnectWise",
        destination: "#service-priority",
        author: "Tyler Green",
        assignee: "Chris Nolan",
        status: "success",
      },
      {
        subject: "Branch printer defaults to offline after nightly reboot",
        company: "Sterling Field Services",
        source: "ConnectWise",
        destination: "#service-dispatch",
        author: "Allison Reed",
        assignee: "Drew Patel",
        status: "success",
      },
      {
        subject: "Mailbox forwarding request for terminated staff account",
        company: "Bayside Property Group",
        source: "ConnectWise",
        destination: "No matching route",
        author: "Jordan Price",
        assignee: "Unassigned",
        status: "unmatched",
      },
      {
        subject: "Monthly patching exceptions need review for lab endpoints",
        company: "Lumen Research Labs",
        source: "ConnectWise",
        destination: "#infra-ops",
        author: "Cameron Bell",
        assignee: "Tori Nguyen",
        status: "failed",
      },
    ],
    systems: [
      {
        name: "ConnectWise",
        status: "Operational",
        detail: "Inbound sync is current and ticket changes are flowing without backlog.",
      },
      {
        name: "Slack",
        status: "Operational",
        detail: "Destination posting remains healthy with a low failure rate.",
      },
      {
        name: "Feed",
        status: "Attention needed",
        detail: "Long-tail routing gaps are still generating unmatched tickets each week.",
      },
    ],
  },
  all: {
    stats: [
      {
        title: "Total Rules",
        value: "12",
        detail: "Active routing rules currently evaluating inbound ticket traffic.",
      },
      {
        title: "Active Integrations",
        value: "2",
        detail: "ConnectWise and Slack are both connected for this workspace.",
      },
      {
        title: "Tickets Routed",
        value: "2,486",
        detail: "Tickets delivered into active destinations since workspace setup.",
      },
      {
        title: "Unmatched Tickets",
        value: "128",
        detail: "Tickets that entered without a matching route since workspace setup.",
      },
      {
        title: "Rules Passing",
        value: "96%",
        detail: "Rule evaluations that ended in a clean delivery without exceptions.",
      },
      {
        title: "Failed Tickets",
        value: "64",
        detail: "Tickets that matched a route but did not post cleanly to the destination.",
      },
      {
        title: "Needs Response",
        value: "163",
        detail: "Open routed tickets still waiting on a technician response.",
      },
      {
        title: "Top Destination",
        value: "#service-dispatch",
        detail: "Most-used destination for routed tickets in the selected window.",
      },
    ],
    activity: [
      {
        subject:
          "Executive mailbox stops syncing on mobile after conditional access prompt",
        company: "Riverview Holdings",
        source: "ConnectWise",
        destination: "#exec-support",
        author: "Hannah Cooper",
        assignee: "Maya Chen",
        status: "success",
      },
      {
        subject: "Line-of-business database timeout on warehouse floor terminals",
        company: "Canyon Freight Partners",
        source: "ConnectWise",
        destination: "#service-priority",
        author: "Noah Peterson",
        assignee: "Chris Nolan",
        status: "success",
      },
      {
        subject: "Payroll export failing after endpoint certificate rotation",
        company: "Elm Street Medical",
        source: "ConnectWise",
        destination: "#finance-systems",
        author: "Olivia Bennett",
        assignee: "Drew Patel",
        status: "failed",
      },
      {
        subject: "Facilities badge printer request for temporary contractor access",
        company: "Granite Commercial",
        source: "ConnectWise",
        destination: "No matching route",
        author: "Grace Morgan",
        assignee: "Unassigned",
        status: "unmatched",
      },
      {
        subject: "Site-to-site VPN instability at west regional office",
        company: "Westport Banking Services",
        source: "ConnectWise",
        destination: "#infra-ops",
        author: "Nathan Flores",
        assignee: "Tori Nguyen",
        status: "success",
      },
    ],
    systems: [
      {
        name: "ConnectWise",
        status: "Operational",
        detail: "Historical sync is healthy and ongoing ticket intake remains stable.",
      },
      {
        name: "Slack",
        status: "Operational",
        detail: "Destination delivery is stable, with failures concentrated in a few recurring routes.",
      },
      {
        name: "Feed",
        status: "Attention needed",
        detail: "Legacy routing gaps still account for most unmatched and failed ticket history.",
      },
    ],
  },
};
