"use client";

export interface ClientAuthSession {
  readonly user: {
    readonly id?: string;
    readonly name?: string | null;
    readonly email?: string | null;
    readonly image?: string | null;
  };
  readonly expires?: string;
}

export async function getFreshClientSession(): Promise<ClientAuthSession | null> {
  try {
    const response = await fetch(`/api/auth/session?fresh=${Date.now()}`, {
      cache: "no-store",
      credentials: "include",
      headers: {
        "Cache-Control": "no-store",
        Pragma: "no-cache",
      },
    });

    if (!response.ok) return null;

    const session = (await response.json()) as unknown;
    if (!isRecord(session) || !isRecord(session.user)) return null;

    return {
      user: session.user as ClientAuthSession["user"],
      expires: typeof session.expires === "string" ? session.expires : undefined,
    };
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
