import Link from "next/link";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(122,134,255,0.22),_transparent_28%),linear-gradient(180deg,_#f7f9fe_0%,_#edf2ff_40%,_#f7f4ee_100%)] px-4 py-12 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="text-[0.9rem] font-medium tracking-[-0.02em] text-slate-600 transition-colors hover:text-slate-950"
        >
          Back to home
        </Link>

        <div className="mt-8 rounded-[2rem] border border-slate-200/70 bg-white/70 px-6 py-8 shadow-[0_20px_55px_rgba(15,23,42,0.05)] ring-1 ring-white/80 backdrop-blur-sm sm:px-8 sm:py-10">
          <div className="text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
            Sign in
          </div>
          <h1 className="mt-4 max-w-[12ch] text-[2.2rem] font-semibold leading-[1.02] tracking-[-0.055em] text-slate-950 sm:text-[3rem]">
            Sign-in flow coming next.
          </h1>
          <p className="mt-4 max-w-[40rem] text-[1rem] leading-8 tracking-[-0.02em] text-slate-600">
            This route is now wired for both primary landing page calls to
            action and future authentication work.
          </p>
        </div>
      </div>
    </main>
  );
}
