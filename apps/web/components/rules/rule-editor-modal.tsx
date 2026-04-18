"use client";

import { useEffect, useMemo, useState } from "react";

import type { RoutingRule, RoutingRuleCondition, SlackChannelSummary } from "@/lib/rules";

const fieldOptions = [
  { value: "ticketSummary", label: "Ticket Summary", placeholder: "Printer offline" },
  { value: "company", label: "Company", placeholder: "thinksocial" },
  { value: "board", label: "Board", placeholder: "Help Desk" },
  { value: "status", label: "Status", placeholder: "New" },
  { value: "contact", label: "Contact", placeholder: "Jane Smith" },
  { value: "assignee", label: "Assignee", placeholder: "alex.m" },
] as const;

const operators = [
  { value: "Equals", label: "Equals" },
  { value: "Not Equals", label: "Not Equals" },
  { value: "Contains", label: "Contains" },
  { value: "Starts With", label: "Starts With" },
] as const;

type RuleEditorModalProps = {
  open: boolean;
  saving: boolean;
  slackChannels: SlackChannelSummary[];
  initialRule?: RoutingRule | null;
  onClose: () => void;
  onSave: (rule: RoutingRule) => void;
};

function defaultCondition(): RoutingRuleCondition {
  return { field: "ticketSummary", operator: "Contains", value: "" };
}

export function RuleEditorModal({
  open,
  saving,
  slackChannels,
  initialRule,
  onClose,
  onSave,
}: RuleEditorModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [destinationChannelId, setDestinationChannelId] = useState("");
  const [conditions, setConditions] = useState<RoutingRuleCondition[]>([defaultCondition()]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (initialRule) {
      setName(initialRule.name);
      setDescription(initialRule.description);
      setEnabled(initialRule.enabled);
      setDestinationChannelId(initialRule.action.targetChannelId);
      setConditions(
        initialRule.match.conditions.length
          ? initialRule.match.conditions.map((condition) => ({ ...condition }))
          : [defaultCondition()],
      );
      return;
    }

    setName("");
    setDescription("");
    setEnabled(true);
    setDestinationChannelId("");
    setConditions([defaultCondition()]);
  }, [open, initialRule]);

  const canSave = useMemo(() => {
    return (
      name.trim() !== ""
      && destinationChannelId.trim() !== ""
      && conditions.every(
        (condition) =>
          condition.field.trim() !== ""
          && condition.operator.trim() !== ""
          && condition.value.trim() !== "",
      )
    );
  }, [conditions, destinationChannelId, name]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-md border border-slate-400/85 bg-white/96 shadow-[0_30px_80px_rgba(15,23,42,0.22)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-300/80 px-6 py-5">
          <div>
            <p className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
              {initialRule ? "Edit rule" : "Create rule"}
            </p>
            <h2 className="mt-1 text-[1.35rem] font-semibold tracking-[-0.04em] text-slate-950">
              {initialRule ? initialRule.name : "New routing rule"}
            </h2>
            <p className="mt-1 text-[0.92rem] text-slate-600">
              Rules are evaluated top to bottom and the first match wins.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300/80 bg-white px-3 py-2 text-[0.86rem] font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-950"
          >
            Close
          </button>
        </div>

        <div className="space-y-6 px-6 py-6">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
            <label className="block">
              <span className="mb-2 block text-[0.84rem] font-medium text-slate-700">
                Rule name
              </span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-12 w-full rounded-md border border-slate-300/85 bg-white px-4 text-[0.92rem] text-slate-700 outline-none transition focus:border-[#93c5fd] focus:ring-4 focus:ring-[#dbeafe]"
                placeholder="VIP Support Route"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-[0.84rem] font-medium text-slate-700">
                Status
              </span>
              <button
                type="button"
                onClick={() => setEnabled((current) => !current)}
                className={`flex h-12 w-full items-center justify-between rounded-md border px-4 text-[0.92rem] font-medium transition ${
                  enabled
                    ? "border-emerald-300/80 bg-emerald-50 text-emerald-700"
                    : "border-slate-300/85 bg-white text-slate-600"
                }`}
              >
                <span>{enabled ? "Active" : "Inactive"}</span>
                <span className="text-[0.76rem] uppercase tracking-[0.12em]">
                  Toggle
                </span>
              </button>
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-[0.84rem] font-medium text-slate-700">
              Description
            </span>
            <textarea
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full rounded-md border border-slate-300/85 bg-white px-4 py-3 text-[0.92rem] text-slate-700 outline-none transition focus:border-[#93c5fd] focus:ring-4 focus:ring-[#dbeafe]"
              placeholder="Routes urgent support tickets into the right Slack channel."
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-[0.84rem] font-medium text-slate-700">
              Slack destination
            </span>
            <select
              value={destinationChannelId}
              onChange={(event) => setDestinationChannelId(event.target.value)}
              className="h-12 w-full rounded-md border border-slate-300/85 bg-white px-4 text-[0.92rem] text-slate-700 outline-none transition focus:border-[#93c5fd] focus:ring-4 focus:ring-[#dbeafe]"
            >
              <option value="">Select Slack channel</option>
              {slackChannels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  Slack (#{channel.name})
                </option>
              ))}
            </select>
          </label>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-[1rem] font-semibold tracking-[-0.03em] text-slate-950">
                  Conditions
                </h3>
                <p className="mt-1 text-[0.88rem] text-slate-600">
                  All conditions must match for the rule to route the ticket.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setConditions((current) => [...current, defaultCondition()])}
                className="rounded-md border border-slate-300/80 bg-white px-3 py-2 text-[0.84rem] font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-950"
              >
                Add condition
              </button>
            </div>

            <div className="space-y-3">
              {conditions.map((condition, index) => (
                <div
                  key={`condition-${index}`}
                  className="rounded-md border border-slate-300/80 bg-slate-50/72 p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Condition {index + 1}
                    </p>
                    {conditions.length > 1 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setConditions((current) =>
                            current.filter((_, conditionIndex) => conditionIndex !== index),
                          )
                        }
                        className="rounded-md border border-rose-300/75 bg-white px-3 py-1.5 text-[0.76rem] font-medium text-rose-600 transition hover:border-rose-400"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>

                  <div className="grid gap-3 md:grid-cols-[180px_180px_minmax(0,1fr)]">
                    <select
                      value={condition.field}
                      onChange={(event) =>
                        setConditions((current) =>
                          current.map((item, conditionIndex) =>
                            conditionIndex === index
                              ? { ...item, field: event.target.value }
                              : item,
                          ),
                        )
                      }
                      className="h-11 rounded-md border border-slate-300/85 bg-white px-4 text-[0.9rem] text-slate-700 outline-none transition focus:border-[#93c5fd] focus:ring-4 focus:ring-[#dbeafe]"
                    >
                      {fieldOptions.map((field) => (
                        <option key={field.value} value={field.value}>
                          {field.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={condition.operator}
                      onChange={(event) =>
                        setConditions((current) =>
                          current.map((item, conditionIndex) =>
                            conditionIndex === index
                              ? { ...item, operator: event.target.value }
                              : item,
                          ),
                        )
                      }
                      className="h-11 rounded-md border border-slate-300/85 bg-white px-4 text-[0.9rem] text-slate-700 outline-none transition focus:border-[#93c5fd] focus:ring-4 focus:ring-[#dbeafe]"
                    >
                      {operators.map((operator) => (
                        <option key={operator.value} value={operator.value}>
                          {operator.label}
                        </option>
                      ))}
                    </select>

                    <input
                      value={condition.value}
                      onChange={(event) =>
                        setConditions((current) =>
                          current.map((item, conditionIndex) =>
                            conditionIndex === index
                              ? { ...item, value: event.target.value }
                              : item,
                          ),
                        )
                      }
                      placeholder={
                        fieldOptions.find((field) => field.value === condition.field)?.placeholder ?? "Value"
                      }
                      className="h-11 rounded-md border border-slate-300/85 bg-white px-4 text-[0.9rem] text-slate-700 outline-none transition focus:border-[#93c5fd] focus:ring-4 focus:ring-[#dbeafe]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-slate-300/80 px-6 py-5">
          <p className="text-[0.88rem] text-slate-600">
            Source system is fixed to ConnectWise for this first rules slice.
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300/80 bg-white px-4 py-2.5 text-[0.9rem] font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-950"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canSave || saving}
              onClick={() => {
                const snapshot = JSON.stringify({
                  sourceSystem: "connectwise",
                  destinationChannelId,
                  conditions,
                });

                onSave({
                  ruleId: initialRule?.ruleId,
                  tenantId: initialRule?.tenantId ?? "",
                  priority: initialRule?.priority ?? 0,
                  enabled,
                  name: name.trim(),
                  description: description.trim(),
                  sourceSystem: "connectwise",
                  stopProcessing: true,
                  match: {
                    joinOperator: "AND",
                    conditions: conditions.map((condition) => ({
                      field: condition.field.trim(),
                      operator: condition.operator.trim(),
                      value: condition.value.trim(),
                    })),
                  },
                  action: {
                    type: "route_to_slack",
                    targetChannelId: destinationChannelId,
                    targetAssignee: initialRule?.action.targetAssignee,
                  },
                  builderVersion: "stage1-form",
                  builderSnapshotJson: snapshot,
                  createdAt: initialRule?.createdAt,
                  updatedAt: initialRule?.updatedAt,
                });
              }}
              className="rounded-md bg-[#2563eb] px-4 py-2.5 text-[0.9rem] font-medium text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : initialRule ? "Save changes" : "Create rule"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
