/** Decorative logo: three bars of different heights, like columns on a board. */
export function BrandMark() {
  return (
    <span aria-hidden="true" className="flex size-7 shrink-0 items-end justify-center gap-0.5 rounded-lg bg-zinc-900 p-1.5">
      <span className="h-4 w-1 rounded-sm bg-slate-300" />
      <span className="h-2.5 w-1 rounded-sm bg-blue-400" />
      <span className="h-3.5 w-1 rounded-sm bg-green-400" />
    </span>
  );
}
