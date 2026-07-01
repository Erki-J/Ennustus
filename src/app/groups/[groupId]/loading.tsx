export default function GroupSectionLoading() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden="true">
      <div className="h-40 rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="space-y-3 p-6">
          <div className="h-5 w-48 rounded bg-zinc-200" />
          <div className="h-4 w-full max-w-md rounded bg-zinc-100" />
          <div className="h-24 rounded-xl bg-zinc-50" />
        </div>
      </div>
    </div>
  );
}
