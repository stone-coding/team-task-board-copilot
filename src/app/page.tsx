import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import { PRIMARY_BUTTON } from "@/components/ui/button-styles";

const STEPS = [
  { title: "Create a project", text: "One project per body of work, private to your account." },
  { title: "Add tasks", text: "Give each task a title and an optional description." },
  { title: "Track progress", text: "Move tasks from To Do to Done and watch the completion rate grow." },
];

export default function Home() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-12 sm:py-16">
        <div className="flex max-w-2xl flex-col gap-4">
          <p className="text-sm font-medium text-blue-700">Kanban for focused teams</p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">Team Task Board</h1>
          <p className="text-base text-zinc-600 sm:text-lg">
            Group work into projects and move tasks from To Do to Done.
          </p>
          <div>
            <Link href="/projects" className={PRIMARY_BUTTON}>
              Your projects
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <div key={step.title} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-zinc-600">Step {index + 1}</p>
              <h2 className="mt-1 text-sm font-semibold text-zinc-900">{step.title}</h2>
              <p className="mt-1 text-sm text-zinc-600">{step.text}</p>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
