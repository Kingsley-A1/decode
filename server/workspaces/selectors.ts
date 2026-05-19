import type { Prisma } from "@prisma/client";

export const workspaceSummarySelect = {
  id: true,
  name: true,
  slug: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.WorkspaceSelect;

export const workspaceMembershipSelect = {
  id: true,
  role: true,
  workspaceId: true,
  userId: true,
  createdAt: true,
  workspace: {
    select: workspaceSummarySelect,
  },
} satisfies Prisma.WorkspaceMemberSelect;
