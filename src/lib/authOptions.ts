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
          const u = await db.user.findUnique({ where: { id: token.sub }, select: { name: true, image: true, email: true } });
          if (u) {
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


