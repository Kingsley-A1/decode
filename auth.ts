import "server-only";

import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth/options";

export function auth() {
  return getServerSession(authOptions);
}

export { authOptions };
