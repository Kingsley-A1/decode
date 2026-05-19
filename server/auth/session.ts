import "server-only";

import { auth } from "@/auth";

export interface RequiredUserSession {
  readonly userId: string;
}

export async function getRequiredUserSession(): Promise<RequiredUserSession | null> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return null;

  return { userId };
}
