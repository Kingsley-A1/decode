import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { AUDIT_ACTION, AUDIT_ENTITY_TYPE } from "@/server/audit/constants";
import { WORKSPACE_ROLE } from "@/server/workspaces/constants";

export interface CreateDefaultWorkspaceForUserInput {
  readonly userId: string;
  readonly displayName?: string | null;
  readonly email?: string | null;
}

export interface DefaultWorkspaceResult {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
}

type WorkspaceTransactionClient = Pick<
  Prisma.TransactionClient,
  "auditLog" | "user" | "workspace" | "workspaceMember"
>;

export function createDefaultWorkspaceForUser(
  input: CreateDefaultWorkspaceForUserInput
): Promise<DefaultWorkspaceResult> {
  return prisma.$transaction((transaction) =>
    upsertDefaultWorkspace(input, transaction)
  );
}

async function upsertDefaultWorkspace(
  input: CreateDefaultWorkspaceForUserInput,
  transaction: WorkspaceTransactionClient
): Promise<DefaultWorkspaceResult> {
  const existingWorkspace = await getExistingDefaultWorkspace(
    input.userId,
    transaction
  );

  if (existingWorkspace) return existingWorkspace;

  return createWorkspaceWithMembership(input, transaction);
}

async function getExistingDefaultWorkspace(
  userId: string,
  transaction: WorkspaceTransactionClient
): Promise<DefaultWorkspaceResult | null> {
  const user = await transaction.user.findUnique({
    where: { id: userId },
    select: {
      defaultWorkspace: {
        select: { id: true, name: true, slug: true, deletedAt: true },
      },
    },
  });

  if (!user?.defaultWorkspace || user.defaultWorkspace.deletedAt) return null;

  return user.defaultWorkspace;
}

async function createWorkspaceWithMembership(
  input: CreateDefaultWorkspaceForUserInput,
  transaction: WorkspaceTransactionClient
): Promise<DefaultWorkspaceResult> {
  const workspace = await transaction.workspace.create({
    data: getDefaultWorkspaceCreateData(input),
    select: { id: true, name: true, slug: true },
  });

  await setUserDefaultWorkspace(input.userId, workspace.id, transaction);
  await writeDefaultWorkspaceAuditLog(input.userId, workspace.id, transaction);

  return workspace;
}

function getDefaultWorkspaceCreateData(
  input: CreateDefaultWorkspaceForUserInput
): Prisma.WorkspaceUncheckedCreateInput {
  return {
    name: "Personal Workspace",
    slug: getDefaultWorkspaceSlug(input),
    ownerId: input.userId,
    members: {
      create: {
        userId: input.userId,
        role: WORKSPACE_ROLE.OWNER,
      },
    },
  };
}

function setUserDefaultWorkspace(
  userId: string,
  workspaceId: string,
  transaction: WorkspaceTransactionClient
): Promise<{ id: string }> {
  return transaction.user.update({
    where: { id: userId },
    data: { defaultWorkspaceId: workspaceId },
    select: { id: true },
  });
}

function writeDefaultWorkspaceAuditLog(
  userId: string,
  workspaceId: string,
  transaction: WorkspaceTransactionClient
): Promise<{ id: string }> {
  return transaction.auditLog.create({
    data: {
      workspaceId,
      actorUserId: userId,
      action: AUDIT_ACTION.CREATE,
      entityType: AUDIT_ENTITY_TYPE.WORKSPACE,
      entityId: workspaceId,
      metadata: { source: "auth.createUser" },
    },
    select: { id: true },
  });
}

function getDefaultWorkspaceSlug({
  userId,
  displayName,
  email,
}: CreateDefaultWorkspaceForUserInput): string {
  const source = displayName || email?.split("@")[0] || "workspace";
  const prefix = slugify(source);

  return `${prefix}-${userId.slice(0, 8).toLowerCase()}`;
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return slug || "workspace";
}
