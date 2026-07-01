"use client";

export default function MatchesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
      <h2 className="font-semibold text-red-900">Mängude tulemused ei laadinud</h2>
      <p className="mt-2 text-sm text-red-800">
        {error.message || "Serveri viga. Proovi lehte uuesti laadida."}
      </p>
      {error.digest && (
        <p className="mt-1 text-xs text-red-600">Viga: {error.digest}</p>
      )}
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
      >
        Proovi uuesti
      </button>
    </section>
  );
}
