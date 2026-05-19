import "server-only";

import { prisma } from "@/server/db/prisma";
import {
  workspaceMembershipSelect,
  workspaceSummarySelect,
} from "@/server/workspaces/selectors";

export interface UserWorkspaceInput {
  readonly userId: string;
}

export interface WorkspaceAccessInput extends UserWorkspaceInput {
  readonly workspaceId: string;
}

export function getDefaultWorkspaceForUser({ userId }: UserWorkspaceInput) {
  return prisma.workspace.findFirst({
    where: {
      deletedAt: null,
      defaultForUsers: { some: { id: userId, deletedAt: null } },
    },
    select: workspaceSummarySelect,
  });
}

export function listWorkspacesForUser({ userId }: UserWorkspaceInput) {
  return prisma.workspace.findMany({
    where: {
      deletedAt: null,
      members: { some: { userId, deletedAt: null } },
    },
    orderBy: { updatedAt: "desc" },
    select: workspaceSummarySelect,
  });
}

export function getWorkspaceAccess({
  userId,
  workspaceId,
}: WorkspaceAccessInput) {
  return prisma.workspaceMember.findFirst({
    where: {
      userId,
      workspaceId,
      deletedAt: null,
      workspace: { deletedAt: null },
    },
    select: workspaceMembershipSelect,
  });
}
