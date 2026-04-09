"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type StageId =
  | "welcome"
  | "systems"
  | "connect"
  | "destination"
  | "review";

type ProviderCard = {
  name: string;
  type: "ticketing" | "messaging";
  status: "active" | "future";
  description: string;
  src: string;
  width: number;
  height: number;
  className?: string;
};

const stages: Array<{ id: StageId; label: string; eyebrow: string }> = [
  { id: "welcome", label: "Welcome", eyebrow: "01" },
  { id: "systems", label: "Choose systems", eyebrow: "02" },
  { id: "connect", label: "Connect platforms", eyebrow: "03" },
  { id: "destination", label: "Pick destination", eyebrow: "04" },
  { id: "review", label: "Review", eyebrow: "05" },
];

const providerCards: ProviderCard[] = [
  {
    name: "ConnectWise",
    type: "ticketing",
    status: "active",
    description: "Route ticket activity from your source system.",
    src: "/connectwise-logo-transparent.png",
    width: 2705,
    height: 421,
    className: "h-5",
  },
  {
    name: "Jira",
    type: "ticketing",
    status: "future",
    description: "Available soon.",
    src: "/jira-logo-transparent.png",
    width: 108,
    height: 23,
    className: "h-6",
  },
  {
    name: "Zendesk",
    type: "ticketing",
    status: "future",
    description: "Available soon.",
    src: "/zendesk-logo-transparent.png",
    width: 88,
    height: 44,
    className: "h-11",
  },
  {
    name: "ServiceNow",
    type: "ticketing",
    status: "future",
    description: "Available soon.",
    src: "/servicenow-logo-transparent.png",
    width: 112,
    height: 20,
    className: "h-4",
  },
  {
    name: "Slack",
    type: "messaging",
    status: "active",
    description: "Send ticket context where teams already respond.",
    src: "/slack-logo-transparent.png",
    width: 96,
    height: 39,
    className: "h-8",
  },
  {
    name: "Microsoft Teams",
    type: "messaging",
    status: "future",
    description: "Available soon.",
    src: "/teams-logo-transparent.png",
    width: 92,
    height: 30,
    className: "h-8",
  },
  {
    name: "Outlook",
    type: "messaging",
    status: "future",
    description: "Available soon.",
    src: "/outlook-logo-transparent.png",
    width: 112,
    height: 16,
    className: "h-4",
  },
  {
    name: "Gmail",
    type: "messaging",
    status: "future",
    description: "Available soon.",
    src: "/gmail-logo-transparent.png",
    width: 92,
    height: 52,
    className: "h-11",
  },
];

function clsx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function readinessTone(ready: boolean) {
  return ready
    ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/15"
    : "bg-amber-500/10 text-amber-800 ring-amber-500/15";
}

export default function OnboardingPage() {
  const [currentStage, setCurrentStage] = useState<StageId>("welcome");
  const [ticketingProvider, setTicketingProvider] =
    useState<string>("ConnectWise");
  const [messagingProvider, setMessagingProvider] = useState<string>("Slack");
  const [slackConnected, setSlackConnected] = useState(false);
  const [connectwiseSaved, setConnectwiseSaved] = useState(false);
  const [destinationSaved, setDestinationSaved] = useState(false);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [connectwiseSite, setConnectwiseSite] = useState("");
  const [connectwiseCompanyId, setConnectwiseCompanyId] = useState("");
  const [connectwiseClientId, setConnectwiseClientId] = useState("");
  const [connectwisePublicKey, setConnectwisePublicKey] = useState("");
  const [connectwisePrivateKey, setConnectwisePrivateKey] = useState("");
  const [slackWorkspaceLabel, setSlackWorkspaceLabel] = useState("");
  const [defaultChannelId, setDefaultChannelId] = useState("");
  const [botInvited, setBotInvited] = useState(false);

  const activeStageIndex = stages.findIndex((stage) => stage.id === currentStage);
  const currentStageMeta = stages[activeStageIndex];
  const progress = ((activeStageIndex + 1) / stages.length) * 100;

  const connectwiseFieldsReady =
    connectwiseSite.trim() !== "" &&
    connectwiseCompanyId.trim() !== "" &&
    connectwiseClientId.trim() !== "" &&
    connectwisePublicKey.trim() !== "" &&
    connectwisePrivateKey.trim() !== "";

  const destinationFieldsReady =
    slackWorkspaceLabel.trim() !== "" &&
    defaultChannelId.trim() !== "" &&
    botInvited;

  const readinessItems = [
    {
      label: "Ticketing source selected",
      ready: ticketingProvider !== "",
    },
    {
      label: "Messaging destination selected",
      ready: messagingProvider !== "",
    },
    {
      label: "ConnectWise details saved",
      ready: connectwiseSaved,
    },
    {
      label: "Slack workspace connected",
      ready: slackConnected,
    },
    {
      label: "Slack destination confirmed",
      ready: destinationSaved,
    },
  ];

  const onboardingReady = readinessItems.every((item) => item.ready);

  const canContinue =
    currentStage === "welcome"
      ? true
      : currentStage === "systems"
        ? ticketingProvider === "ConnectWise" && messagingProvider === "Slack"
        : currentStage === "connect"
          ? slackConnected && connectwiseSaved
          : currentStage === "destination"
            ? destinationSaved
            : onboardingReady && reviewConfirmed;

  const goToNextStage = () => {
    const nextStage = stages[activeStageIndex + 1];
    if (nextStage) setCurrentStage(nextStage.id);
  };

  const goToPreviousStage = () => {
    const previousStage = stages[activeStageIndex - 1];
    if (previousStage) setCurrentStage(previousStage.id);
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f9fe_0%,#edf2ff_44%,#f7f4ee_100%)] px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-[0.9rem] font-medium tracking-[-0.02em] text-slate-600 transition-colors hover:text-slate-950"
          >
            Back to home
          </Link>
          <Link
            href="/contact-sales"
            className="text-[0.92rem] font-medium tracking-[-0.02em] text-slate-700 transition-colors hover:text-slate-950"
          >
            Contact sales
          </Link>
        </div>

        <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="relative overflow-hidden rounded-[2.2rem] border border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(244,247,255,0.78))] px-5 py-6 shadow-[0_24px_60px_rgba(15,23,42,0.05)] ring-1 ring-white/80 backdrop-blur-sm sm:px-7 sm:py-7 lg:px-9 lg:py-8">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-[4%] top-[6%] h-44 w-44 rounded-full bg-[#fb7185]/24 blur-3xl" />
              <div className="absolute right-[6%] top-[12%] h-44 w-44 rounded-full bg-[#facc15]/22 blur-3xl" />
              <div className="absolute left-[30%] bottom-[10%] h-48 w-48 rounded-full bg-[#34d399]/18 blur-3xl" />
              <div className="absolute right-[24%] bottom-[6%] h-48 w-48 rounded-full bg-[#60a5fa]/22 blur-3xl" />
              <div className="absolute left-[50%] top-[20%] h-34 w-34 rounded-full bg-[#c084fc]/18 blur-3xl" />
            </div>
            <div className="relative flex flex-col gap-5 border-b border-slate-200/70 pb-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
                    Onboarding
                  </div>
                  <h1 className="mt-3 max-w-[14ch] text-[2rem] font-semibold leading-[1.02] tracking-[-0.055em] text-slate-950 sm:text-[2.55rem]">
                    {currentStage === "welcome"
                      ? "Connect your first workflow."
                      : currentStage === "systems"
                        ? "Choose your source and destination."
                        : currentStage === "connect"
                          ? "Connect both platforms."
                          : currentStage === "destination"
                            ? "Choose where ticket traffic lands."
                            : "Review your setup before entering Dropwise."}
                  </h1>
                  <p className="mt-4 max-w-[42rem] text-[1rem] leading-8 tracking-[-0.02em] text-slate-600">
                    {currentStage === "welcome"
                      ? "This walkthrough gets your first source and destination ready so ticket activity can move cleanly into messaging."
                      : currentStage === "systems"
                        ? "Start with one ticketing source and one messaging destination. Unavailable providers stay visible so the shape of the product is clear."
                        : currentStage === "connect"
                          ? "Provide the connection details for the platforms you selected."
                          : currentStage === "destination"
                            ? "Choose the Slack channel that should receive the first ticket flow."
                            : "Confirm the setup details before you move into the product."}
                  </p>
                </div>

                <div className="min-w-[12rem] rounded-[1.3rem] bg-white/72 px-4 py-4 ring-1 ring-white/80 shadow-[0_14px_30px_rgba(148,163,184,0.08)]">
                  <div className="flex items-center justify-between gap-4 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    <span>Step</span>
                    <span>
                      {currentStageMeta.eyebrow} / {String(stages.length).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="mt-3 text-[1rem] font-semibold tracking-[-0.02em] text-slate-900">
                    {currentStageMeta.label}
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-slate-200/70">
                    <div
                      className="h-2 rounded-full bg-[linear-gradient(90deg,#93c5fd,#2563eb)] transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-5">
                {stages.map((stage, index) => {
                  const isActive = stage.id === currentStage;
                  const isComplete = index < activeStageIndex;
                  return (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => setCurrentStage(stage.id)}
                      className={clsx(
                        "rounded-[1.2rem] px-4 py-3 text-left transition-all duration-200",
                        isActive
                          ? "bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(239,246,255,0.82))] text-slate-900 ring-1 ring-[#60a5fa]/35 shadow-[0_16px_34px_rgba(59,130,246,0.10)]"
                          : "bg-white/72 text-slate-700 ring-1 ring-white/80 hover:bg-white",
                      )}
                    >
                      <div
                        className={clsx(
                          "text-[0.68rem] font-semibold uppercase tracking-[0.18em]",
                          isActive ? "text-[#2563eb]" : "text-slate-400",
                        )}
                      >
                        {stage.eyebrow}
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-3">
                        <span className="text-[0.94rem] font-semibold tracking-[-0.02em]">
                          {stage.label}
                        </span>
                        <span
                          className={clsx(
                            "rounded-full px-2 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em]",
                            isActive
                              ? "bg-[#3b82f6]/10 text-[#2563eb]"
                              : isComplete
                                ? "bg-emerald-500/10 text-emerald-700"
                                : "bg-slate-200/70 text-slate-500",
                          )}
                        >
                          {isActive ? "Now" : isComplete ? "Done" : "Next"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative pt-7">
              {currentStage === "welcome" ? (
                <div className="space-y-6">
                  <div className="grid gap-4 lg:grid-cols-3">
                    {[
                      {
                        title: "Choose systems",
                        copy: "Start with one ticketing source and one messaging destination.",
                      },
                      {
                        title: "Connect details",
                        copy: "Add the fields needed to move ticket activity between them.",
                      },
                      {
                        title: "Confirm destination",
                        copy: "Pick the Slack channel where the first flow should arrive.",
                      },
                    ].map((item) => (
                      <div
                        key={item.title}
                        className="rounded-[1.4rem] bg-white/78 px-5 py-5 ring-1 ring-white/80 shadow-[0_14px_28px_rgba(148,163,184,0.08)]"
                      >
                        <div className="text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          {item.title}
                        </div>
                        <p className="mt-3 text-[0.96rem] leading-7 tracking-[-0.02em] text-slate-700">
                          {item.copy}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="relative overflow-hidden rounded-[1.5rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(244,247,255,0.78))] px-5 py-5 ring-1 ring-white/80 shadow-[0_18px_38px_rgba(148,163,184,0.10)]">
                    <div className="pointer-events-none absolute inset-0">
                      <div className="absolute left-[6%] top-[14%] h-32 w-32 rounded-full bg-[#fb7185]/20 blur-3xl" />
                      <div className="absolute right-[10%] top-[20%] h-32 w-32 rounded-full bg-[#60a5fa]/20 blur-3xl" />
                      <div className="absolute right-[24%] bottom-[6%] h-32 w-32 rounded-full bg-[#34d399]/16 blur-3xl" />
                    </div>
                    <div className="relative text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
                      Team rollout
                    </div>
                    <p className="relative mt-3 max-w-[42rem] text-[0.96rem] leading-7 tracking-[-0.02em] text-slate-700">
                      If you are setting up a broader rollout across more users,
                      more destinations, or a more complex deployment, take the
                      team path instead.
                    </p>
                    <Link
                      href="/contact-sales"
                      className="relative mt-5 inline-flex rounded-full bg-[#3b82f6] px-4 py-2 text-[0.92rem] font-semibold tracking-[-0.02em] text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#2f76ef]"
                    >
                      Contact sales
                    </Link>
                  </div>
                </div>
              ) : null}

              {currentStage === "systems" ? (
                <div className="grid gap-6 xl:grid-cols-2">
                  {(["ticketing", "messaging"] as const).map((type) => (
                    <div
                      key={type}
                      className="rounded-[1.6rem] bg-white/76 px-5 py-5 ring-1 ring-white/80 shadow-[0_14px_28px_rgba(148,163,184,0.08)]"
                    >
                      <div className="text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        {type === "ticketing"
                          ? "Ticketing source"
                          : "Messaging destination"}
                      </div>
                      <div className="mt-4 grid gap-3">
                        {providerCards
                          .filter((provider) => provider.type === type)
                          .map((provider) => {
                            const isSelected =
                              type === "ticketing"
                                ? ticketingProvider === provider.name
                                : messagingProvider === provider.name;

                            return (
                              <button
                                key={provider.name}
                                type="button"
                                disabled={provider.status === "future"}
                                onClick={() => {
                                  if (provider.status === "future") return;
                                  if (type === "ticketing") {
                                    setTicketingProvider(provider.name);
                                  } else {
                                    setMessagingProvider(provider.name);
                                  }
                                }}
                                className={clsx(
                                  "relative overflow-hidden rounded-[1.25rem] px-4 py-4 text-left transition-all duration-200",
                                  provider.status === "future"
                                    ? "cursor-not-allowed bg-white/92 text-slate-400 ring-1 ring-slate-200/70"
                                    : isSelected
                                      ? "bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(239,246,255,0.86))] text-slate-900 ring-1 ring-[#60a5fa]/35 shadow-[0_16px_34px_rgba(59,130,246,0.10)]"
                                      : "bg-white text-slate-700 ring-1 ring-slate-200/70 hover:-translate-y-0.5 hover:bg-slate-50",
                                )}
                              >
                                {provider.status === "future" ? (
                                  <div className="absolute inset-0 z-10 bg-white/65" />
                                ) : null}
                                <div className="relative z-20">
                                  <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                      <Image
                                        src={provider.src}
                                        alt={provider.name}
                                        width={provider.width}
                                        height={provider.height}
                                        className={clsx(
                                          "w-auto object-contain",
                                          provider.className ?? "h-8",
                                          provider.status === "future"
                                            ? "opacity-40 grayscale"
                                            : isSelected
                                              ? "opacity-100"
                                              : "opacity-90",
                                        )}
                                      />
                                      <span className="text-[1rem] font-semibold tracking-[-0.02em]">
                                        {provider.name}
                                      </span>
                                    </div>
                                    <span
                                      className={clsx(
                                        "rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em]",
                                        provider.status === "future"
                                          ? "bg-slate-200/80 text-slate-500"
                                          : isSelected
                                            ? "bg-[#3b82f6]/10 text-[#2563eb]"
                                            : "bg-[#3b82f6]/10 text-[#2563eb]",
                                      )}
                                    >
                                      {provider.status === "future"
                                        ? "Soon"
                                        : "Selected"}
                                    </span>
                                  </div>
                                  <p
                                    className={clsx(
                                      "mt-3 text-[0.92rem] leading-6 tracking-[-0.02em]",
                                        provider.status === "future"
                                          ? "text-slate-400"
                                          : isSelected
                                            ? "text-slate-600"
                                            : "text-slate-500",
                                      )}
                                    >
                                    {provider.description}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {currentStage === "connect" ? (
                <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                  <div className="min-w-0 rounded-[1.6rem] bg-white/76 px-5 py-5 ring-1 ring-white/80 shadow-[0_14px_28px_rgba(148,163,184,0.08)]">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Slack
                        </div>
                        <p className="mt-2 text-[0.96rem] leading-7 tracking-[-0.02em] text-slate-600">
                          Connect the workspace that should receive ticket
                          activity.
                        </p>
                      </div>
                      <span
                        className={clsx(
                          "rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] ring-1",
                          readinessTone(slackConnected),
                        )}
                      >
                        {slackConnected ? "Connected" : "Pending"}
                      </span>
                    </div>

                    <label className="mt-5 grid min-w-0 gap-2 text-[0.92rem] tracking-[-0.02em] text-slate-700">
                      <span className="font-medium">Workspace label</span>
                      <input
                        value={slackWorkspaceLabel}
                        onChange={(event) =>
                          setSlackWorkspaceLabel(event.target.value)
                        }
                        placeholder="Acme IT Slack"
                        className="h-12 w-full min-w-0 rounded-[1rem] border border-slate-200/80 bg-white px-4 outline-none transition focus:border-[#60a5fa] focus:ring-4 focus:ring-[#60a5fa]/10"
                      />
                    </label>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setSlackConnected(true)}
                        className="inline-flex h-11 items-center justify-center rounded-full bg-[#3b82f6] px-5 text-[0.94rem] font-semibold tracking-[-0.02em] shadow-[0_12px_28px_rgba(59,130,246,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#2f76ef]"
                        style={{ color: "#fff" }}
                      >
                        Connect Slack
                      </button>
                      <button
                        type="button"
                        onClick={() => setSlackConnected(false)}
                        className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-[0.94rem] font-semibold tracking-[-0.02em] text-slate-700 ring-1 ring-slate-200/70 transition-colors hover:bg-slate-50"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  <div className="min-w-0 rounded-[1.6rem] bg-white/76 px-5 py-5 ring-1 ring-white/80 shadow-[0_14px_28px_rgba(148,163,184,0.08)]">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          ConnectWise
                        </div>
                        <p className="mt-2 text-[0.96rem] leading-7 tracking-[-0.02em] text-slate-600">
                          Save the account details needed for your first source
                          connection.
                        </p>
                      </div>
                      <span
                        className={clsx(
                          "rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] ring-1",
                          readinessTone(connectwiseSaved),
                        )}
                      >
                        {connectwiseSaved ? "Saved" : "Pending"}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                      <label className="grid min-w-0 gap-2 text-[0.92rem] tracking-[-0.02em] text-slate-700">
                        <span className="font-medium">Site</span>
                        <input
                          value={connectwiseSite}
                          onChange={(event) =>
                            setConnectwiseSite(event.target.value)
                          }
                          placeholder="na.myconnectwise.net"
                          className="h-12 w-full min-w-0 rounded-[1rem] border border-slate-200/80 bg-white px-4 outline-none transition focus:border-[#60a5fa] focus:ring-4 focus:ring-[#60a5fa]/10"
                        />
                      </label>
                      <label className="grid min-w-0 gap-2 text-[0.92rem] tracking-[-0.02em] text-slate-700">
                        <span className="font-medium">Company ID</span>
                        <input
                          value={connectwiseCompanyId}
                          onChange={(event) =>
                            setConnectwiseCompanyId(event.target.value)
                          }
                          placeholder="your-manage-company-id"
                          className="h-12 w-full min-w-0 rounded-[1rem] border border-slate-200/80 bg-white px-4 outline-none transition focus:border-[#60a5fa] focus:ring-4 focus:ring-[#60a5fa]/10"
                        />
                      </label>
                      <label className="grid min-w-0 gap-2 text-[0.92rem] tracking-[-0.02em] text-slate-700">
                        <span className="font-medium">Client ID</span>
                        <input
                          value={connectwiseClientId}
                          onChange={(event) =>
                            setConnectwiseClientId(event.target.value)
                          }
                          className="h-12 w-full min-w-0 rounded-[1rem] border border-slate-200/80 bg-white px-4 outline-none transition focus:border-[#60a5fa] focus:ring-4 focus:ring-[#60a5fa]/10"
                        />
                      </label>
                      <label className="grid min-w-0 gap-2 text-[0.92rem] tracking-[-0.02em] text-slate-700">
                        <span className="font-medium">Public key</span>
                        <input
                          value={connectwisePublicKey}
                          onChange={(event) =>
                            setConnectwisePublicKey(event.target.value)
                          }
                          className="h-12 w-full min-w-0 rounded-[1rem] border border-slate-200/80 bg-white px-4 outline-none transition focus:border-[#60a5fa] focus:ring-4 focus:ring-[#60a5fa]/10"
                        />
                      </label>
                      <label className="grid min-w-0 gap-2 text-[0.92rem] tracking-[-0.02em] text-slate-700 lg:col-span-2">
                        <span className="font-medium">Private key</span>
                        <input
                          value={connectwisePrivateKey}
                          onChange={(event) =>
                            setConnectwisePrivateKey(event.target.value)
                          }
                          type="password"
                          className="h-12 w-full min-w-0 rounded-[1rem] border border-slate-200/80 bg-white px-4 outline-none transition focus:border-[#60a5fa] focus:ring-4 focus:ring-[#60a5fa]/10"
                        />
                      </label>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setConnectwiseSaved(connectwiseFieldsReady)
                        }
                        disabled={!connectwiseFieldsReady}
                        className="inline-flex h-11 items-center justify-center rounded-full bg-[#3b82f6] px-5 text-[0.94rem] font-semibold tracking-[-0.02em] shadow-[0_12px_28px_rgba(59,130,246,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#2f76ef] disabled:cursor-not-allowed disabled:opacity-50"
                        style={{ color: "#fff" }}
                      >
                        Save ConnectWise details
                      </button>
                      <button
                        type="button"
                        onClick={() => setConnectwiseSaved(false)}
                        className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-[0.94rem] font-semibold tracking-[-0.02em] text-slate-700 ring-1 ring-slate-200/70 transition-colors hover:bg-slate-50"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {currentStage === "destination" ? (
                <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
                  <div className="min-w-0 rounded-[1.6rem] bg-white/76 px-5 py-5 ring-1 ring-white/80 shadow-[0_14px_28px_rgba(148,163,184,0.08)]">
                    <label className="grid min-w-0 gap-2 text-[0.92rem] tracking-[-0.02em] text-slate-700">
                      <span className="font-medium">Default Slack channel ID</span>
                      <input
                        value={defaultChannelId}
                        onChange={(event) =>
                          setDefaultChannelId(event.target.value)
                        }
                        placeholder="C012ABCDEF1"
                        className="h-12 w-full min-w-0 rounded-[1rem] border border-slate-200/80 bg-white px-4 outline-none transition focus:border-[#60a5fa] focus:ring-4 focus:ring-[#60a5fa]/10"
                      />
                    </label>

                    <label className="mt-4 flex items-start gap-3 rounded-[1.2rem] bg-white px-4 py-4 ring-1 ring-slate-200/70">
                      <input
                        type="checkbox"
                        checked={botInvited}
                        onChange={(event) => setBotInvited(event.target.checked)}
                        className="mt-1 h-4 w-4"
                      />
                      <span className="text-[0.94rem] leading-7 tracking-[-0.02em] text-slate-700">
                        I invited the Dropwise bot to the selected Slack
                        channel.
                      </span>
                    </label>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setDestinationSaved(destinationFieldsReady)
                        }
                        disabled={!destinationFieldsReady}
                        className="inline-flex h-11 items-center justify-center rounded-full bg-[#3b82f6] px-5 text-[0.94rem] font-semibold tracking-[-0.02em] shadow-[0_12px_28px_rgba(59,130,246,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#2f76ef] disabled:cursor-not-allowed disabled:opacity-50"
                        style={{ color: "#fff" }}
                      >
                        Save destination
                      </button>
                      <button
                        type="button"
                        onClick={() => setDestinationSaved(false)}
                        className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-[0.94rem] font-semibold tracking-[-0.02em] text-slate-700 ring-1 ring-slate-200/70 transition-colors hover:bg-slate-50"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  <div className="rounded-[1.6rem] bg-white/76 px-5 py-5 ring-1 ring-white/80 shadow-[0_14px_28px_rgba(148,163,184,0.08)]">
                    <div className="text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Channel checklist
                    </div>
                    <div className="mt-4 space-y-3 text-[0.96rem] leading-7 tracking-[-0.02em] text-slate-700">
                      <p>Choose the Slack channel where the first ticket flow should arrive.</p>
                      <p>Confirm the bot has been invited before you continue.</p>
                      <p>Keep this initial destination simple so setup stays easy to verify.</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {currentStage === "review" ? (
                <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
                  <div className="rounded-[1.6rem] bg-white/76 px-5 py-5 ring-1 ring-white/80 shadow-[0_14px_28px_rgba(148,163,184,0.08)]">
                    <div className="text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Setup summary
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {[
                        { label: "Ticketing provider", value: ticketingProvider },
                        { label: "Messaging provider", value: messagingProvider },
                        {
                          label: "Slack workspace",
                          value: slackWorkspaceLabel || "Not saved",
                        },
                        {
                          label: "Slack channel",
                          value: defaultChannelId || "Not saved",
                        },
                        {
                          label: "ConnectWise site",
                          value: connectwiseSite || "Not saved",
                        },
                        {
                          label: "Bot invited",
                          value: botInvited ? "Confirmed" : "Not confirmed",
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-[1rem] bg-white px-4 py-3 ring-1 ring-slate-200/70"
                        >
                          <div className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            {item.label}
                          </div>
                          <div className="mt-1 text-[0.96rem] tracking-[-0.02em] text-slate-800">
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.6rem] bg-white/76 px-5 py-5 ring-1 ring-white/80 shadow-[0_14px_28px_rgba(148,163,184,0.08)]">
                    <div className="text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Final check
                    </div>
                    <p className="mt-4 text-[0.96rem] leading-7 tracking-[-0.02em] text-slate-700">
                      Confirm the setup details and continue into the product.
                    </p>
                    <label className="mt-5 flex items-start gap-3 rounded-[1.2rem] bg-white px-4 py-4 ring-1 ring-slate-200/70">
                      <input
                        type="checkbox"
                        checked={reviewConfirmed}
                        onChange={(event) =>
                          setReviewConfirmed(event.target.checked)
                        }
                        className="mt-1 h-4 w-4"
                      />
                      <span className="text-[0.94rem] leading-7 tracking-[-0.02em] text-slate-700">
                        I reviewed the setup details and I am ready to continue.
                      </span>
                    </label>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-slate-200/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-[0.92rem] tracking-[-0.02em] text-slate-500">
                Move stage by stage and finish only when the setup is ready.
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={goToPreviousStage}
                  disabled={activeStageIndex === 0}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-[0.94rem] font-semibold tracking-[-0.02em] text-slate-700 ring-1 ring-slate-200/70 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Back
                </button>

                {currentStage === "review" ? (
                  <Link
                    href={onboardingReady && reviewConfirmed ? "/" : "#"}
                    aria-disabled={!onboardingReady || !reviewConfirmed}
                    className={clsx(
                      "inline-flex h-11 items-center justify-center rounded-full px-5 text-[0.94rem] font-semibold tracking-[-0.02em] transition-all duration-200",
                      onboardingReady && reviewConfirmed
                        ? "bg-[#3b82f6] text-white shadow-[0_12px_28px_rgba(59,130,246,0.28)] hover:-translate-y-0.5 hover:bg-[#2f76ef]"
                        : "cursor-not-allowed bg-slate-200/80 text-slate-400",
                    )}
                  >
                    Enter Dropwise
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={goToNextStage}
                    disabled={!canContinue}
                    className="inline-flex h-11 items-center justify-center rounded-full bg-[#3b82f6] px-5 text-[0.94rem] font-semibold tracking-[-0.02em] shadow-[0_12px_28px_rgba(59,130,246,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#2f76ef] disabled:cursor-not-allowed disabled:bg-slate-200/80 disabled:text-slate-400 disabled:shadow-none"
                    style={{ color: canContinue ? "#fff" : undefined }}
                  >
                    Continue
                  </button>
                )}
              </div>
            </div>
          </section>

          <aside className="xl:sticky xl:top-8 xl:self-start">
            <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(244,247,255,0.78))] px-5 py-6 shadow-[0_24px_60px_rgba(15,23,42,0.05)] ring-1 ring-white/80 backdrop-blur-sm sm:px-6">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-[8%] top-[10%] h-32 w-32 rounded-full bg-[#fb7185]/18 blur-3xl" />
                <div className="absolute right-[6%] top-[24%] h-32 w-32 rounded-full bg-[#facc15]/18 blur-3xl" />
                <div className="absolute right-[16%] bottom-[8%] h-36 w-36 rounded-full bg-[#60a5fa]/18 blur-3xl" />
              </div>
              <div className="relative text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Readiness
              </div>
              <div className="relative mt-4 space-y-3">
                {readinessItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-4 rounded-[1rem] bg-slate-50/90 px-4 py-3 ring-1 ring-slate-200/70"
                  >
                    <span className="text-[0.94rem] tracking-[-0.02em] text-slate-700">
                      {item.label}
                    </span>
                    <span
                      className={clsx(
                        "rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] ring-1",
                        readinessTone(item.ready),
                      )}
                    >
                      {item.ready ? "Ready" : "Pending"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="relative mt-5 rounded-[1.3rem] bg-white/76 px-4 py-4 ring-1 ring-white/80 shadow-[0_14px_30px_rgba(148,163,184,0.08)]">
                <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Progress
                </div>
                <div className="mt-2 text-[1.5rem] font-semibold tracking-[-0.04em] text-slate-950">
                  {Math.round(progress)}%
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-200/70">
                  <div
                    className="h-2 rounded-full bg-[linear-gradient(90deg,#93c5fd,#2563eb)] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
