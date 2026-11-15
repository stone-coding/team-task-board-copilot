export type ProjectRole = "OWNER" | "MEMBER";

// Project as returned by the API and passed to the UI. `createdAt` is an ISO 8601 string; `role` is the caller's role.
export type Project = {
  id: string;
  name: string;
  createdAt: string;
  role: ProjectRole;
};

export type ProjectMemberInfo = {
  userId: string;
  name: string;
  email: string;
  role: ProjectRole;
};
