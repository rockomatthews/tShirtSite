import type { NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import { ensureEmailWallet } from "@/lib/crossmint";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist provider profile on first sign-in
      if (account && profile) {
        const p: any = profile;
        token.email = (token.email as any) || p.email || token.email;
        token.name = (token.name as any) || p.name || token.name;
        token.picture = (token.picture as any) || p.picture || (p.image as any) || token.picture;
      }
      // Merge DB state each time by email
      try {
        const email = (token.email as string) || undefined;
        if (email) {
          const u = await db.user.findUnique({ where: { email }, select: { id: true, name: true, image: true, email: true } });
          if (u) {
            (token as any).uid = u.id; // our app userId
            if (u.name) token.name = u.name as any;
            if (u.image) token.picture = u.image as any;
            token.email = u.email as any;
          }
        }
      } catch {}
      return token;
    },
    async session({ session, token }) {
      (session as any).userId = (token as any).uid || token.sub || (session as any).userId;
      if (session.user) {
        if (token.name) session.user.name = token.name as any;
        if ((token as any).picture) session.user.image = (token as any).picture as any;
        if (token.email) session.user.email = token.email as any;
      }
      return session;
    },
  },
  events: {
    async signIn(message) {
      try {
        const u: any = (message as any)?.user ?? {};
        const email: string | undefined = u?.email;
        if (email) {
          await ensureEmailWallet({ email });
          // Ensure our User row exists/updates on each sign-in
          await db.user.upsert({
            where: { email },
            update: { name: u?.name ?? undefined, image: (u?.image ?? u?.picture ?? undefined) as any },
            create: { email, name: u?.name ?? null, image: (u?.image ?? u?.picture ?? null) as any, role: "user" },
          });
        }
      } catch {}
    },
  },
};


