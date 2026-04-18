export type RoutingRuleCondition = {
  field: string;
  operator: string;
  value: string;
};

export type RoutingRule = {
  ruleId?: string;
  tenantId: string;
  priority: number;
  enabled: boolean;
  name: string;
  description: string;
  sourceSystem: string;
  stopProcessing: boolean;
  match: {
    joinOperator: string;
    conditions: RoutingRuleCondition[];
  };
  action: {
    type: string;
    targetChannelId: string;
    targetAssignee?: string;
  };
  builderVersion?: string;
  builderSnapshotJson?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type SlackChannelSummary = {
  id: string;
  name: string;
};

export type ReorderRulesRequest = {
  tenantId: string;
  ruleIds: string[];
};

function apiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }
  return "http://localhost:8080";
}

export async function loadRules(tenantId: string): Promise<RoutingRule[]> {
  const response = await fetch(
    `${apiBaseUrl()}/api/app/rules/${encodeURIComponent(tenantId)}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error("Failed to load rules.");
  }

  return (await response.json()) as RoutingRule[];
}

export async function createRule(rule: RoutingRule): Promise<RoutingRule> {
  const response = await fetch(`${apiBaseUrl()}/api/app/rules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rule),
  });

  if (!response.ok) {
    throw new Error("Failed to create rule.");
  }

  return (await response.json()) as RoutingRule;
}

export async function updateRule(
  tenantId: string,
  ruleId: string,
  rule: RoutingRule,
): Promise<RoutingRule> {
  const response = await fetch(
    `${apiBaseUrl()}/api/app/rules/${encodeURIComponent(tenantId)}/${encodeURIComponent(ruleId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rule),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to update rule.");
  }

  return (await response.json()) as RoutingRule;
}

export async function deleteRule(
  tenantId: string,
  ruleId: string,
  priority: number,
): Promise<void> {
  const response = await fetch(
    `${apiBaseUrl()}/api/app/rules/${encodeURIComponent(tenantId)}/${encodeURIComponent(ruleId)}?priority=${priority}`,
    { method: "DELETE" },
  );

  if (!response.ok) {
    throw new Error("Failed to delete rule.");
  }
}

export async function reorderRules(
  request: ReorderRulesRequest,
): Promise<RoutingRule[]> {
  const response = await fetch(`${apiBaseUrl()}/api/app/rules/reorder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error("Failed to reorder rules.");
  }

  return (await response.json()) as RoutingRule[];
}

export async function loadSlackChannels(
  tenantId: string,
): Promise<SlackChannelSummary[]> {
  const response = await fetch(
    `${apiBaseUrl()}/api/app/slack/channels/${encodeURIComponent(tenantId)}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error("Failed to load Slack channels.");
  }

  return (await response.json()) as SlackChannelSummary[];
}
