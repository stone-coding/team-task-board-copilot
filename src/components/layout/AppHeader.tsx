import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { FOCUS_RING } from "@/components/ui/button-styles";
import { BrandMark } from "@/components/layout/BrandMark";

type AppHeaderProps = {
  /** The top-level page being shown, marked with aria-current in the navigation. */
  current?: "projects";
};

const NAV_LINK = `rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${FOCUS_RING}`;

export function AppHeader({ current }: AppHeaderProps) {
  const onProjects = current === "projects";
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/" className={`flex items-center gap-2 rounded-lg text-sm font-semibold text-zinc-900 ${FOCUS_RING}`}>
            <BrandMark />
            <span className="truncate">Team Task Board</span>
          </Link>
          <nav aria-label="Main" className="flex items-center">
            <Link
              href="/projects"
              aria-current={onProjects ? "page" : undefined}
              className={`${NAV_LINK} ${onProjects ? "bg-zinc-100 text-zinc-900" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"}`}
            >
              Projects
            </Link>
          </nav>
        </div>
        <LogoutButton />
      </div>
    </header>
  );
}
