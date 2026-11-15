// A task comment as returned by the API. `createdAt` is an ISO 8601 string.
export type TaskComment = {
  id: string;
  taskId: string;
  body: string;
  createdAt: string;
  author: { userId: string; name: string };
};
