"use client";

import { useRouter } from "next/navigation";
import { GHOST_BUTTON } from "@/components/ui/button-styles";

export function LogoutButton() {
  const router = useRouter();

  async function handleClick() {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <button type="button" onClick={handleClick} className={`${GHOST_BUTTON} shrink-0`}>
      Log out
    </button>
  );
}
