export const dynamic = "force-dynamic";
import { MockCheck } from "@/components/skeleton/mock-check";

export default function TechnicalPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
      <section
        aria-labelledby="page-title"
        className="w-full rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-12"
      >
        <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-teal-700">
          University guidance · Phase 1
        </p>
        <h1
          id="page-title"
          className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl"
        >
          Technical skeleton
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
          The local foundation is ready for the next development step. This is a
          technical check using a synthetic fixture.
        </p>
        <div className="my-7 rounded-xl bg-slate-50 p-5 text-sm leading-6 text-slate-600">
          <p>
            <strong className="text-slate-900">Mock mode</strong> · No external
            AI or cloud database is connected.
          </p>
          <p>There are no program recommendations or saved sessions yet.</p>
        </div>
        <MockCheck />
      </section>
    </main>
  );
}
