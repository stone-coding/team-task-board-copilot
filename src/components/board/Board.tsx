"use client";

import { useReducer } from "react";
import { AddTaskForm } from "@/components/board/AddTaskForm";
import { BoardColumn } from "@/components/board/BoardColumn";
import { FormError } from "@/components/ui/FormError";
import { GENERIC_ERROR_MESSAGE, readApiErrorMessage } from "@/lib/api-error";
import { boardReducer, groupTasksByStatus } from "@/lib/board";
import { TASK_STATUSES } from "@/lib/task-status";
import type { Task, TaskStatus } from "@/lib/tasks";

type BoardProps = {
  projectId: string;
  initialTasks: Task[];
};

async function saveStatus(taskId: string, status: TaskStatus): Promise<Task> {
  const response = await fetch(`/api/v1/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response));
  }
  const body: { task: Task } = await response.json();
  return body.task;
}

export function Board({ projectId, initialTasks }: BoardProps) {
  const [{ tasks, error }, dispatch] = useReducer(boardReducer, { tasks: initialTasks, error: null });
  const tasksByStatus = groupTasksByStatus(tasks);

  async function handleStatusChange(taskId: string, status: TaskStatus) {
    const task = tasks.find((candidate) => candidate.id === taskId);
    if (!task || task.status === status) {
      return;
    }
    dispatch({ type: "statusChangeStarted", taskId, status });
    try {
      dispatch({ type: "statusChangeSucceeded", task: await saveStatus(taskId, status) });
    } catch (saveError) {
      // fetch rejects with a TypeError when the network fails; API errors carry their own message.
      const reason = saveError instanceof TypeError || !(saveError instanceof Error) ? GENERIC_ERROR_MESSAGE : saveError.message;
      dispatch({
        type: "statusChangeFailed",
        taskId,
        status,
        previousStatus: task.status,
        message: `Could not save the status of "${task.title}": ${reason}`,
      });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <AddTaskForm projectId={projectId} onCreated={(task) => dispatch({ type: "taskAdded", task })} />
      <FormError message={error} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {TASK_STATUSES.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            tasks={tasksByStatus[status]}
            onStatusChange={handleStatusChange}
            onTaskSaved={(task) => dispatch({ type: "taskUpdated", task })}
            onTaskDeleted={(taskId) => dispatch({ type: "taskRemoved", taskId })}
          />
        ))}
      </div>
    </div>
  );
}
