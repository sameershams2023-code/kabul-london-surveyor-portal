export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="h-8 w-40 animate-pulse rounded-md bg-slate-200" />
      <div className="rounded-md border border-line bg-white p-4 shadow-soft">
        <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="rounded-md border border-line bg-white p-4 shadow-soft">
        <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-4 w-full animate-pulse rounded bg-slate-100" />
        <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  );
}
