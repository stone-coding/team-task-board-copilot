export const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";

const BUTTON_BASE = `inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING}`;

export const PRIMARY_BUTTON = `${BUTTON_BASE} bg-zinc-900 px-4 py-2 text-white shadow-sm hover:bg-zinc-700`;

export const SECONDARY_BUTTON = `${BUTTON_BASE} border border-zinc-300 bg-white px-3 py-1.5 text-zinc-900 shadow-sm hover:bg-zinc-50`;

export const GHOST_BUTTON = `${BUTTON_BASE} px-2.5 py-1.5 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900`;

export const DANGER_BUTTON = `${BUTTON_BASE} bg-red-700 px-3 py-1.5 font-semibold text-white shadow-sm hover:bg-red-800`;

export const TEXT_LINK = `font-medium text-blue-700 underline underline-offset-2 hover:text-blue-800 ${FOCUS_RING}`;

export const INPUT = `w-full rounded-lg border border-zinc-400 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm ${FOCUS_RING}`;
