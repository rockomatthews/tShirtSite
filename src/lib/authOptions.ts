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
    async session({ session, token }) {
      if (token?.sub) {
        (session as any).userId = token.sub;
        try {
          // Prefer lookup by our internal user id; fall back to email
          let u = await db.user.findUnique({ where: { id: token.sub }, select: { id: true, name: true, image: true, email: true } });
          if (!u && session.user?.email) {
            u = await db.user.findUnique({ where: { email: session.user.email }, select: { id: true, name: true, image: true, email: true } });
          }
          if (u) {
            (session as any).userId = u.id;
            if (u.name) session.user!.name = u.name;
            if (u.image) session.user!.image = u.image as any;
            if (u.email) session.user!.email = u.email;
          }
        } catch {}
      }
      return session;
    },
  },
  events: {
    async signIn(message) {
      try {
        const email: string | undefined = (message as any)?.user?.email;
        if (email) await ensureEmailWallet({ email });
      } catch {}
    },
  },
};


