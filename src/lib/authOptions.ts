import type { NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import { ensureEmailWallet } from "@/lib/crossmint";

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
      if (token?.sub) (session as any).userId = token.sub;
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


