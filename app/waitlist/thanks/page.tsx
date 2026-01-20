export default function WaitlistThanksPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-14">
        {/* Top brand */}
        <header className="flex items-center justify-between">
          <a href="/" className="inline-flex items-center">
            <img
              src="/brand/boatality-logo.png"
              alt="Boatality"
              className="h-9 w-auto"
            />
          </a>

          <a
            href="/login"
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            Creator Studio
          </a>
        </header>

        {/* Card */}
        <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm md:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Request received
          </div>

          <h1 className="mt-5 text-balance text-3xl font-semibold tracking-tight md:text-4xl text-slate-900">
            You’re on the Boatality beta list
          </h1>

          <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-slate-600">
            We’ve received your request and added you to the waitlist. We’re bringing creators and early
            users in waves so the experience stays solid as we scale.
          </p>

          <div className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 md:grid-cols-3">
            <div>
              <p className="font-medium text-slate-900">What happens next</p>
              <p className="mt-1">We review submissions and invite the next wave.</p>
            </div>
            <div>
              <p className="font-medium text-slate-900">How you’ll know</p>
              <p className="mt-1">You’ll get an email when you’re approved.</p>
            </div>
            <div>
              <p className="font-medium text-slate-900">Need to update</p>
              <p className="mt-1">Submit the form again—your email will be updated.</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-md bg-[#C84121] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#b73327]"
            >
              Back to home
            </a>
            <a
              href="/waitlist"
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Submit another request
            </a>
          </div>

          <p className="mt-8 text-xs text-slate-600">
            Tip: If you’re a creator, include your channels/links so we can review faster.
          </p>
        </section>

        <footer className="mt-10 flex items-center justify-center gap-3 text-xs text-slate-500">
          <img
            src="/brand/boatality-icon.png"
            alt="Boatality"
            className="h-5 w-5"
          />
          <span className="leading-none">Built for the water — not the algorithm.</span>
        </footer>
      </div>
    </main>
  );
}