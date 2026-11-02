import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Team Task Board</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Group work into projects and move tasks from To Do to Done.
      </p>
      <Link className="font-medium text-blue-700 underline dark:text-blue-400" href="/projects/demo">
        Open the demo board
      </Link>
      <LogoutButton />
    </main>
  );
}
