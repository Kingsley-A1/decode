import "server-only";

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/server/db/prisma";
import { createDefaultWorkspaceForUser } from "@/server/workspaces/service";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
    }),
  ],
  session: {
    strategy: "database",
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }

      return session;
    },
  },
  events: {
    async createUser({ user }) {
      await createDefaultWorkspaceForUser({
        userId: user.id,
        displayName: user.name,
        email: user.email,
      });
    },
  },
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
};
