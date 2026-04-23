"use client";

import { useEffect, useMemo, useState } from "react";

type TenantConfigResponse = {
  tenantId?: string;
  connectwiseSite?: string;
  connectwiseCompanyId?: string;
  slackWorkspaceId?: string;
  defaultChannelId?: string;
  connectwiseConnected?: boolean;
  slackConnected?: boolean;
  botInvited?: boolean;
  onboardingCompleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

function apiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }
  return "http://localhost:8080";
}

function formatTimestamp(value?: string) {
  if (!value) {
    return "Not yet available";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function statusTone(ready: boolean) {
  return ready
    ? "bg-emerald-500/10 text-emerald-700 ring-emerald-100"
    : "bg-amber-500/10 text-amber-700 ring-amber-100";
}

function statusLabel(ready: boolean, readyLabel: string, pendingLabel: string) {
  return ready ? readyLabel : pendingLabel;
}

function configValue(value?: string) {
  return value && value.trim() ? value.trim() : "Not configured";
}

function SectionRow({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <dt className="text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </dt>
      <dd
        className={`text-[0.95rem] tracking-[-0.02em] sm:max-w-[26rem] sm:text-right ${
          muted ? "text-slate-500" : "text-slate-800"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

export default function SettingsPage() {
  const [tenantId, setTenantId] = useState("");
  const [config, setConfig] = useState<TenantConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

    async function loadSettings() {
      try {
        setLoading(true);
        const response = await fetch(
          `${apiBaseUrl()}/api/app/tenant-config/${encodeURIComponent(nextTenantId)}`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          throw new Error("Failed to load tenant settings.");
        }

        const payload = (await response.json()) as TenantConfigResponse;
        if (!cancelled) {
          setConfig(payload);
          setError(null);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error ? caught.message : "Failed to load tenant settings.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  const connectwiseReady = Boolean(config?.connectwiseConnected);
  const slackReady = Boolean(config?.slackConnected);
  const destinationReady = Boolean(config?.defaultChannelId && config?.botInvited);
  const onboardingReady = Boolean(config?.onboardingCompleted);

  const overview = useMemo(
    () => [
      {
        label: "ConnectWise",
        value: statusLabel(connectwiseReady, "Connected", "Needs attention"),
        ready: connectwiseReady,
        detail: connectwiseReady
          ? "Ticket intake and provider authentication are active for this workspace."
          : "ConnectWise still needs configuration or verification.",
      },
      {
        label: "Slack",
        value: statusLabel(slackReady, "Connected", "Needs attention"),
        ready: slackReady,
        detail: slackReady
          ? "Slack workspace connection is active for routing and thread communication."
          : "Slack is not fully connected for this workspace.",
      },
      {
        label: "Destination",
        value: statusLabel(destinationReady, "Ready", "Incomplete"),
        ready: destinationReady,
        detail: destinationReady
          ? "A default Slack channel is configured and the bot invite has been confirmed."
          : "The default destination channel or invite confirmation is still missing.",
      },
      {
        label: "Onboarding",
        value: statusLabel(onboardingReady, "Complete", "Incomplete"),
        ready: onboardingReady,
        detail: onboardingReady
          ? "The current workspace passed the first-run readiness review."
          : "The workspace has not yet been marked complete in onboarding.",
      },
    ],
    [connectwiseReady, destinationReady, onboardingReady, slackReady],
  );

  return (
    <div className="space-y-6">
      <section className="rounded-md border border-slate-400/85 bg-white/92 p-5 shadow-[0_16px_34px_rgba(15,23,42,0.06)] sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Workspace settings
            </p>
            <h1 className="mt-1 text-[1.6rem] font-semibold tracking-[-0.045em] text-slate-950">
              Settings
            </h1>
            <p className="mt-2 max-w-2xl text-[0.95rem] leading-7 tracking-[-0.018em] text-slate-600">
              Review the tenant identity, integration health, and onboarding-derived
              configuration currently driving routing and Slack communication.
            </p>
          </div>

          <div className="rounded-md border border-slate-300/85 bg-slate-50/88 px-4 py-3 text-[0.86rem] tracking-[-0.018em] text-slate-600">
            <div className="font-semibold text-slate-800">Tenant</div>
            <div className="mt-1 break-all">{configValue(config?.tenantId ?? tenantId)}</div>
          </div>
        </div>
      </section>

      {loading ? (
        <section className="rounded-md border border-slate-400/85 bg-white/92 px-6 py-16 text-center shadow-[0_16px_34px_rgba(15,23,42,0.06)]">
          <h2 className="text-[1.1rem] font-semibold tracking-[-0.03em] text-slate-950">
            Loading settings
          </h2>
          <p className="mt-2 text-[0.92rem] text-slate-600">
            Pulling the latest tenant configuration and integration state.
          </p>
        </section>
      ) : error ? (
        <section className="rounded-md border border-rose-400/75 bg-rose-50/92 px-6 py-10 text-center shadow-[0_16px_34px_rgba(15,23,42,0.06)]">
          <h2 className="text-[1.1rem] font-semibold tracking-[-0.03em] text-rose-700">
            Settings unavailable
          </h2>
          <p className="mt-2 text-[0.92rem] text-rose-700/80">{error}</p>
        </section>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {overview.map((item) => (
              <article
                key={item.label}
                className="rounded-md border border-slate-400/80 bg-white/94 px-4 py-4 shadow-[0_12px_24px_rgba(15,23,42,0.05)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[0.82rem] font-medium tracking-[-0.015em] text-slate-500">
                    {item.label}
                  </p>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.12em] ring-1 ${statusTone(
                      item.ready,
                    )}`}
                  >
                    {item.value}
                  </span>
                </div>
                <p className="mt-3 text-[0.9rem] leading-6 tracking-[-0.018em] text-slate-700">
                  {item.detail}
                </p>
              </article>
            ))}
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <section className="rounded-md border border-slate-400/85 bg-white/92 p-5 shadow-[0_16px_34px_rgba(15,23,42,0.06)] sm:p-6">
              <div>
                <p className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Tenant summary
                </p>
                <h2 className="mt-1 text-[1.2rem] font-semibold tracking-[-0.035em] text-slate-950">
                  Workspace identity
                </h2>
              </div>

              <dl className="mt-5 divide-y divide-slate-200/80">
                <SectionRow label="Tenant ID" value={configValue(config?.tenantId ?? tenantId)} />
                <SectionRow
                  label="Created"
                  value={formatTimestamp(config?.createdAt)}
                  muted={!config?.createdAt}
                />
                <SectionRow
                  label="Last updated"
                  value={formatTimestamp(config?.updatedAt)}
                  muted={!config?.updatedAt}
                />
                <SectionRow
                  label="Readiness"
                  value={
                    onboardingReady
                      ? "Workspace passed onboarding review and is ready for operational use."
                      : "Workspace still reflects an incomplete onboarding review."
                  }
                  muted={!onboardingReady}
                />
              </dl>
            </section>

            <section className="rounded-md border border-slate-400/85 bg-white/92 p-5 shadow-[0_16px_34px_rgba(15,23,42,0.06)] sm:p-6">
              <div>
                <p className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Current configuration
                </p>
                <h2 className="mt-1 text-[1.2rem] font-semibold tracking-[-0.035em] text-slate-950">
                  Onboarding-derived values
                </h2>
              </div>

              <dl className="mt-5 divide-y divide-slate-200/80">
                <SectionRow label="Source system" value="ConnectWise" />
                <SectionRow label="Messaging platform" value="Slack" />
                <SectionRow
                  label="Default channel"
                  value={configValue(config?.defaultChannelId)}
                  muted={!config?.defaultChannelId}
                />
                <SectionRow
                  label="Slack workspace"
                  value={configValue(config?.slackWorkspaceId)}
                  muted={!config?.slackWorkspaceId}
                />
              </dl>
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-md border border-slate-400/85 bg-white/92 p-5 shadow-[0_16px_34px_rgba(15,23,42,0.06)] sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Ticketing integration
                  </p>
                  <h2 className="mt-1 text-[1.2rem] font-semibold tracking-[-0.035em] text-slate-950">
                    ConnectWise
                  </h2>
                </div>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.12em] ring-1 ${statusTone(
                    connectwiseReady,
                  )}`}
                >
                  {statusLabel(connectwiseReady, "Connected", "Needs attention")}
                </span>
              </div>

              <dl className="mt-5 divide-y divide-slate-200/80">
                <SectionRow
                  label="Site"
                  value={configValue(config?.connectwiseSite)}
                  muted={!config?.connectwiseSite}
                />
                <SectionRow
                  label="Company ID"
                  value={configValue(config?.connectwiseCompanyId)}
                  muted={!config?.connectwiseCompanyId}
                />
                <SectionRow
                  label="Status"
                  value={
                    connectwiseReady
                      ? "Provider credentials and webhook-backed traffic are configured."
                      : "Provider connection still needs attention before relying on live intake."
                  }
                  muted={!connectwiseReady}
                />
              </dl>
            </section>

            <section className="rounded-md border border-slate-400/85 bg-white/92 p-5 shadow-[0_16px_34px_rgba(15,23,42,0.06)] sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Messaging integration
                  </p>
                  <h2 className="mt-1 text-[1.2rem] font-semibold tracking-[-0.035em] text-slate-950">
                    Slack
                  </h2>
                </div>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.12em] ring-1 ${statusTone(
                    slackReady,
                  )}`}
                >
                  {statusLabel(slackReady, "Connected", "Needs attention")}
                </span>
              </div>

              <dl className="mt-5 divide-y divide-slate-200/80">
                <SectionRow
                  label="Workspace ID"
                  value={configValue(config?.slackWorkspaceId)}
                  muted={!config?.slackWorkspaceId}
                />
                <SectionRow
                  label="Default channel"
                  value={configValue(config?.defaultChannelId)}
                  muted={!config?.defaultChannelId}
                />
                <SectionRow
                  label="Bot invite"
                  value={statusLabel(Boolean(config?.botInvited), "Confirmed", "Not confirmed")}
                  muted={!config?.botInvited}
                />
                <SectionRow
                  label="Status"
                  value={
                    slackReady && destinationReady
                      ? "Slack routing and thread communication are ready for this workspace."
                      : "Slack connection exists, but destination readiness still needs review."
                  }
                  muted={!(slackReady && destinationReady)}
                />
              </dl>
            </section>
          </div>

          <section className="rounded-md border border-slate-300/85 bg-[linear-gradient(180deg,rgba(248,250,252,0.9),rgba(255,255,255,0.92))] p-5 shadow-[0_12px_24px_rgba(15,23,42,0.04)] sm:p-6">
            <div>
              <p className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Deferred controls
              </p>
              <h2 className="mt-1 text-[1.15rem] font-semibold tracking-[-0.03em] text-slate-950">
                Next admin capabilities
              </h2>
              <p className="mt-2 max-w-3xl text-[0.93rem] leading-7 tracking-[-0.018em] text-slate-600">
                This first settings slice is read-first. Reconnect flows, destination updates,
                onboarding re-entry, and broader admin controls should be added only once the
                underlying save paths are defined cleanly.
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
