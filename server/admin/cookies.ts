import "server-only";

import type { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/server/admin/constants";

export function setAdminSessionCookie({
  response,
  token,
  expiresAt,
}: {
  readonly response: NextResponse;
  readonly token: string;
  readonly expiresAt: Date;
}): void {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
  });
}

export function clearAdminSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}
