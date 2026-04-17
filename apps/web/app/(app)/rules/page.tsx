"use client";

import { useEffect, useMemo, useState } from "react";

import { RuleEditorModal } from "@/components/rules/rule-editor-modal";
import {
  createRule,
  deleteRule,
  loadRules,
  loadSlackChannels,
  reorderRules,
  updateRule,
  type RoutingRule,
  type SlackChannelSummary,
} from "@/lib/rules";

function destinationLabel(rule: RoutingRule, channels: SlackChannelSummary[]) {
  const channel = channels.find((item) => item.id === rule.action.targetChannelId);
  return channel ? `Slack (#${channel.name})` : rule.action.targetChannelId || "Slack channel";
}

function conditionsSummary(rule: RoutingRule) {
  return (
    rule.match.conditions
      .map((condition) =>
        [condition.field, condition.operator, condition.value].filter(Boolean).join(" "),
      )
      .join(" AND ") || "No conditions"
  );
}

export default function RulesPage() {
  const [tenantId, setTenantId] = useState("");
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [slackChannels, setSlackChannels] = useState<SlackChannelSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [channelsError, setChannelsError] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  useEffect(() => {
    const storedTenantId = window.localStorage.getItem("dropwiseTenantId");
    if (!storedTenantId) {
      setError("No tenant is available yet for this workspace.");
      setLoading(false);
      return;
    }

    const nextTenantId = storedTenantId;
    setTenantId(nextTenantId);

    let cancelled = false;

    async function refresh() {
      try {
        setLoading(true);
        const [loadedRules, loadedChannels] = await Promise.all([
          loadRules(nextTenantId),
          loadSlackChannels(nextTenantId).catch((caught) => {
            if (!cancelled) {
              setChannelsError(
                caught instanceof Error ? caught.message : "Failed to load Slack channels.",
              );
            }
            return [];
          }),
        ]);

        if (!cancelled) {
          setRules(loadedRules.sort((left, right) => left.priority - right.priority));
          setSlackChannels(loadedChannels);
          setError(null);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Failed to load rules.");
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

  const editingRule = useMemo(
    () => rules.find((rule) => rule.ruleId === editingRuleId) ?? null,
    [editingRuleId, rules],
  );

  async function refreshRules() {
    if (!tenantId) {
      return;
    }

    const loadedRules = await loadRules(tenantId);
    setRules(loadedRules.sort((left, right) => left.priority - right.priority));
  }

  async function handleSaveRule(rule: RoutingRule) {
    if (!tenantId) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editingRule?.ruleId) {
        await updateRule(tenantId, editingRule.ruleId, {
          ...rule,
          tenantId,
          ruleId: editingRule.ruleId,
          priority: editingRule.priority,
        });
      } else {
        await createRule({ ...rule, tenantId });
      }

      await refreshRules();
      setIsEditorOpen(false);
      setEditingRuleId(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save rule.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(rule: RoutingRule) {
    if (!tenantId || !rule.ruleId) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await updateRule(tenantId, rule.ruleId, {
        ...rule,
        enabled: !rule.enabled,
      });
      await refreshRules();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to update rule.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(rule: RoutingRule) {
    if (!tenantId || !rule.ruleId) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await deleteRule(tenantId, rule.ruleId, rule.priority);
      await refreshRules();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to delete rule.");
    } finally {
      setSaving(false);
    }
  }

  async function handleReorder(ruleId: string, direction: "up" | "down") {
    const currentIndex = rules.findIndex((rule) => rule.ruleId === ruleId);
    if (currentIndex === -1 || !tenantId) {
      return;
    }

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= rules.length) {
      return;
    }

    const reordered = [...rules];
    const [movedRule] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, movedRule);

    const ruleIds = reordered
      .map((rule) => rule.ruleId)
      .filter((value): value is string => Boolean(value));

    setSaving(true);
    setError(null);

    try {
      const updated = await reorderRules({ tenantId, ruleIds });
      setRules(updated.sort((left, right) => left.priority - right.priority));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to reorder rules.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="space-y-6">
        <section className="rounded-md border border-slate-400/85 bg-white/92 p-5 shadow-[0_16px_34px_rgba(15,23,42,0.06)] sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Routing rules
              </p>
              <h1 className="mt-1 text-[1.6rem] font-semibold tracking-[-0.045em] text-slate-950">
                Rules
              </h1>
              <p className="mt-2 max-w-3xl text-[0.92rem] leading-7 tracking-[-0.015em] text-slate-600">
                Create and manage live routing rules. Rules are evaluated top to bottom and
                the first match wins.
              </p>
            </div>

            <button
              type="button"
              disabled={!slackChannels.length}
              onClick={() => {
                setEditingRuleId(null);
                setIsEditorOpen(true);
              }}
              className="inline-flex h-11 items-center justify-center rounded-md bg-[#2563eb] px-5 text-[0.92rem] font-medium text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Create rule
            </button>
          </div>
        </section>

        {channelsError ? (
          <section className="rounded-md border border-amber-400/75 bg-amber-50/92 px-6 py-4 text-[0.9rem] text-amber-800 shadow-[0_16px_34px_rgba(15,23,42,0.04)]">
            Slack channels are not available yet. {channelsError}
          </section>
        ) : null}

        {error ? (
          <section className="rounded-md border border-rose-400/75 bg-rose-50/92 px-6 py-4 text-[0.9rem] text-rose-700 shadow-[0_16px_34px_rgba(15,23,42,0.04)]">
            {error}
          </section>
        ) : null}

        {loading ? (
          <section className="rounded-md border border-slate-400/85 bg-white/92 px-6 py-16 text-center shadow-[0_16px_34px_rgba(15,23,42,0.06)]">
            <h2 className="text-[1.1rem] font-semibold tracking-[-0.03em] text-slate-950">
              Loading rules
            </h2>
            <p className="mt-2 text-[0.92rem] text-slate-600">
              Pulling the current routing rules for this workspace.
            </p>
          </section>
        ) : rules.length === 0 ? (
          <section className="rounded-md border border-slate-400/85 bg-white/92 px-6 py-16 text-center shadow-[0_16px_34px_rgba(15,23,42,0.06)]">
            <h2 className="text-[1.1rem] font-semibold tracking-[-0.03em] text-slate-950">
              No rules yet
            </h2>
            <p className="mt-2 text-[0.92rem] text-slate-600">
              Create the first routing rule to start sending matched tickets into Slack.
            </p>
          </section>
        ) : (
          <section className="space-y-4">
            {rules.map((rule, index) => (
              <article
                key={rule.ruleId ?? `${rule.priority}-${rule.name}`}
                className="rounded-md border border-slate-400/85 bg-white/92 p-5 shadow-[0_16px_34px_rgba(15,23,42,0.06)] sm:p-6"
              >
                <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-[1.18rem] font-semibold tracking-[-0.03em] text-slate-950">
                        {rule.name}
                      </h2>
                      <span className="rounded-full border border-slate-300/80 bg-slate-50/76 px-3 py-1 text-[0.74rem] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Priority {rule.priority}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-[0.74rem] font-semibold uppercase tracking-[0.12em] ${
                          rule.enabled
                            ? "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-100"
                            : "bg-slate-500/10 text-slate-600 ring-1 ring-slate-200"
                        }`}
                      >
                        {rule.enabled ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="mt-2 max-w-3xl text-[0.92rem] leading-7 tracking-[-0.015em] text-slate-600">
                      {rule.description || "No description provided."}
                    </p>

                    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <InfoCard label="Source" value={rule.sourceSystem} />
                      <InfoCard
                        label="Destination"
                        value={destinationLabel(rule, slackChannels)}
                      />
                      <InfoCard label="Conditions" value={conditionsSummary(rule)} />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={saving || index === 0}
                      onClick={() => void handleReorder(rule.ruleId ?? "", "up")}
                      className="inline-flex h-11 items-center justify-center rounded-md border border-slate-400/75 bg-white px-4 text-[0.9rem] font-medium text-slate-700 transition hover:border-slate-500 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Move up
                    </button>
                    <button
                      type="button"
                      disabled={saving || index === rules.length - 1}
                      onClick={() => void handleReorder(rule.ruleId ?? "", "down")}
                      className="inline-flex h-11 items-center justify-center rounded-md border border-slate-400/75 bg-white px-4 text-[0.9rem] font-medium text-slate-700 transition hover:border-slate-500 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Move down
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleToggle(rule)}
                      className="inline-flex h-11 items-center justify-center rounded-md border border-slate-400/75 bg-white px-4 text-[0.9rem] font-medium text-slate-700 transition hover:border-slate-500 hover:bg-slate-50 disabled:opacity-50"
                    >
                      {rule.enabled ? "Pause" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRuleId(rule.ruleId ?? null);
                        setIsEditorOpen(true);
                      }}
                      className="inline-flex h-11 items-center justify-center rounded-md border border-slate-400/75 bg-white px-4 text-[0.9rem] font-medium text-slate-700 transition hover:border-slate-500 hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleDelete(rule)}
                      className="inline-flex h-11 items-center justify-center rounded-md border border-rose-400/70 bg-white px-4 text-[0.9rem] font-medium text-rose-600 transition hover:border-rose-500 hover:bg-rose-50 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>

      <RuleEditorModal
        open={isEditorOpen}
        saving={saving}
        slackChannels={slackChannels}
        initialRule={editingRule}
        onClose={() => {
          if (saving) {
            return;
          }
          setIsEditorOpen(false);
          setEditingRuleId(null);
        }}
        onSave={(rule) => {
          void handleSaveRule(rule);
        }}
      />
    </>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-400/75 bg-slate-50/76 p-4">
      <p className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-[0.92rem] font-medium leading-7 tracking-[-0.02em] text-slate-900">
        {value}
      </p>
    </div>
  );
}
