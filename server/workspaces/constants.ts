export const WORKSPACE_ROLE = {
  OWNER: "owner",
  ADMIN: "admin",
  MEMBER: "member",
} as const;

export type WorkspaceRole =
  (typeof WORKSPACE_ROLE)[keyof typeof WORKSPACE_ROLE];
