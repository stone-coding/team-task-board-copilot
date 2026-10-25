"use client";

import { useState } from "react";
import { BoardColumn } from "@/components/board/BoardColumn";
import { TASK_STATUSES } from "@/lib/task-status";
import type { Task, TaskStatus } from "@/lib/tasks";

type BoardProps = {
  initialTasks: Task[];
};

export function Board({ initialTasks }: BoardProps) {
  const [tasks, setTasks] = useState(initialTasks);

  function handleStatusChange(taskId: string, status: TaskStatus) {
    setTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === taskId ? { ...task, status } : task)),
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {TASK_STATUSES.map((status) => (
        <BoardColumn
          key={status}
          status={status}
          tasks={tasks.filter((task) => task.status === status)}
          onStatusChange={handleStatusChange}
        />
      ))}
    </div>
  );
}