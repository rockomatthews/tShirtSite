import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { ensureEmailWallet } from "@/lib/crossmint";

const authOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  session: { strategy: "jwt" as const },
  callbacks: {
    async session({ session, token }: any) {
      if (token?.sub) {
        (session as any).userId = token.sub;
      }
      return session;
    },
  },
  events: {
    async signIn(message: any) {
      try {
        const email: string | undefined = message?.user?.email;
        if (email) await ensureEmailWallet({ email });
      } catch {}
    },
  },
};

const handler = NextAuth(authOptions as any);
export { handler as GET, handler as POST };


