"use client";

import { useState } from "react";
import type { Task, TaskStatus } from "@/lib/tasks";

const columns: Array<{ status: TaskStatus; title: string; accent: string }> = [
  { status: "TODO", title: "To Do", accent: "todo" },
  { status: "IN_PROGRESS", title: "In Progress", accent: "progress" },
  { status: "DONE", title: "Done", accent: "done" },
];

const statusLabels: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

interface BoardProps {
  project: { name: string };
  initialTasks: Task[];
}

export default function Board({ project, initialTasks }: BoardProps) {
  const [tasks, setTasks] = useState(initialTasks);

  function updateStatus(taskId: string, status: TaskStatus) {
    setTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === taskId ? { ...task, status } : task)),
    );
  }

  return (
    <>
      <header className="board-header">
        <div className="board-header-inner">
          <p className="breadcrumb">Projects / {project.name}</p>
          <h1>{project.name}</h1>
        </div>
      </header>
      <main className="board-main">
        <div className="board-grid">
          {columns.map((column) => {
            const columnTasks = tasks.filter((task) => task.status === column.status);

            return (
              <section
                className={`board-column board-column-${column.accent}`}
                aria-labelledby={`column-${column.status}`}
                key={column.status}
              >
                <h2 id={`column-${column.status}`}>
                  <span>{column.title}</span>
                  <span className="task-count">{columnTasks.length}</span>
                </h2>
                {columnTasks.length > 0 ? (
                  <ul className="task-list">
                    {columnTasks.map((task) => (
                      <li className="task-card" key={task.id}>
                        <h3>{task.title}</h3>
                        {task.description && <p>{task.description}</p>}
                        <label className="status-control">
                          <span aria-hidden="true">Status</span>
                          <select
                            aria-label={`Status for ${task.title}`}
                            value={task.status}
                            onChange={(event) =>
                              updateStatus(task.id, event.target.value as TaskStatus)
                            }
                          >
                            {columns.map((option) => (
                              <option key={option.status} value={option.status}>
                                {statusLabels[option.status]}
                              </option>
                            ))}
                          </select>
                        </label>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-state">No tasks yet</p>
                )}
              </section>
            );
          })}
        </div>
      </main>
    </>
  );
}